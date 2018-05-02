import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import { Item, Rating, Popup, Header, Loader } from 'semantic-ui-react';

import * as util from '../common/util';
import { ListoSource } from '../model/listo';

class Home extends Component {

  constructor() {
    super();
    this.state = {
      // list of user starred repo objects
      listos: [ ],
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
    const recommendRepo = this.listoSource.repoDetails[rec.to_rid];
    const basedOnRepo = this.listoSource.repoDetails[rec.from_rid];
    const repoView = (
      <Item key={recommendRepo.id}>
        <Item.Image size='tiny' src={(recommendRepo.owner || {}).avatar_url} circular={true} />
        <Item.Content>
          <Item.Meta>
            because you liked <a href={basedOnRepo.html_url} target="_blank">{basedOnRepo.full_name}</a>
            <Popup position='right center' trigger={<Rating disabled={true} icon='star' rating={rec.score * 5} maxRating={5} />}>
              <Popup.Content>
                {rec.score * 5} / 5
              </Popup.Content>
            </Popup>
          </Item.Meta>
          <Item.Header as='a' href={recommendRepo.html_url} target="_blank">{recommendRepo.full_name}</Item.Header>
          <Item.Meta>{recommendRepo.description}</Item.Meta>
          <Item.Extra>{(recommendRepo.topics || []).join(' ')}</Item.Extra>
          <Item.Extra as='a' onClick={() => this.listoSource.showMoreOf(recommendRepo.id)} target="_blank">
            show me more like this
          </Item.Extra>
        </Item.Content>
      </Item>
    );

    return repoView;
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
          <p>Or <Link to="/">Go see some most post popular repos</Link></p>
        </Header>
      </div>
    );
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
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
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
