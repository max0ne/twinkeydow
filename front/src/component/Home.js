import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Item, Rating, Popup, Header, Loader, Tab } from 'semantic-ui-react';

import * as util from '../common/util';
import * as api from '../common/api';
import { ListoSource } from '../model/listo';

class Home extends Component {

  constructor() {
    super();
    this.state = {
      // list of user starred repo objects
      listos: [],
      userBasedRepos: [],
      reachedEnd: false,
    }

    this.renderRecommendRepo = this.renderRecommendRepo.bind(this);
  }

  async componentWillMount() {
    this.listoSource = new ListoSource(() => {
      this.setState({
        listos: this.listoSource.listos(),
        reachedEnd: this.listoSource.reachedEnd,
      });
    });

    this.listoSource.grow(10);
    this.reloadUserBasedRecommends();
  }

  async reloadUserBasedRecommends() {
    try {
      this.setState({
        userBasedRepos: await Promise.all((await api.getUserBasedRecommend()).rids.map(api.getRepoDetail)),
      });
    } catch (error) {
      util.toastError(error);
    }
  }

  renderUserStar(repo) {
    return (
      <Item key={repo.id}>
        <Item.Image size='tiny' src={(repo.owner || {}).avatar_url} circular={true} />
        <Item.Content>
          <Item.Header as='a' href={repo.html_url}>{repo.full_name}</Item.Header>
          <Item.Meta>{`${repo.owner.login}/${repo.description}`}</Item.Meta>
          <Item.Extra>{(repo.topics || []).join(' ')}</Item.Extra>
        </Item.Content>
      </Item>
    );
  }

  /**
   * { basedOn: rid, score: number, rid: string }
   * 
   * @param {object} rec
   * @param {string} rec.from_rid
   * @param {number} rec.to_rid
   * @param {string} rec.score
   * @param {string} rec.reason 'star' || 'show_more'
   */
  renderRecommendRepo(rec) {
    const repoDetail = this.listoSource.repoDetails;
    return this.renderRepo(repoDetail[rec.to_rid], repoDetail[rec.from_rid], rec.score);
  }

  renderRepo(repo, basedOnRepo, score=1) {
    return (
      <Item key={repo.id}>
        <Item.Image size='tiny' src={(repo.owner || {}).avatar_url} circular={true} />
        <Item.Content>
          {
            basedOnRepo && (
              <Item.Meta>
                because you liked <a href={basedOnRepo.html_url} target="_blank">{basedOnRepo.full_name}</a>
                <Popup position='right center' trigger={<Rating disabled={true} icon='star' rating={score * 5} maxRating={5} />}>
                  <Popup.Content>
                    {score * 5} / 5
                </Popup.Content>
                </Popup>
              </Item.Meta>
            )
          }
          <Item.Header as='a' href={repo.html_url} target="_blank">{repo.full_name}</Item.Header>
          <Item.Meta>{repo.description}</Item.Meta>
          <Item.Extra>{(repo.topics || []).join(' ')}</Item.Extra>
          <Item.Extra as='a' onClick={() => this.listoSource.showMoreOf(repo.id)} target="_blank">
            show me more like this
          </Item.Extra>
        </Item.Content>
      </Item>
    );
  }

  renderNoRecommendAvailable() {
    return (
      <div>
        <Header as='h1' icon textAlign='center'>
          <Header.Content>
            <span role='img' aria-label='not found'>🤷</span>
          </Header.Content>
        </Header>
        <Header as='h3' textAlign='center'>
          <p>You starred {this.state.userStars.length} repos, none of which are in our database.</p>
          <p>Checkout tomorrow for your personalized recommendations</p>
          <p>Or <a href="https://github.com/explore" target="_blank">Go see some most post popular repos</a></p>
        </Header>
      </div>
    );
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
    const panes = [
      { menuItem: 'Item Based', render: () => this.renderItemBased() },
      { menuItem: 'User Based', render: () => this.renderUserBased() },
    ];
    return (
      <Tab menu={{ secondary: true }} panes={panes} />
    );
  }

  renderItemBased() {
    if (this.state.listos.length === 0) {
      return this.state.reachedEnd ?
        this.renderNoRecommendAvailable() :
        this.renderLoading();
    }
    return (
      <Item.Group>
        {
          this.state.listos.map(this.renderRecommendRepo)
        }
      </Item.Group>
    );
  }

  renderUserBased() {
    return (
      <Item.Group>
        {
          this.state.userBasedRepos.map((repo) => this.renderRepo(repo))
        }
      </Item.Group>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
