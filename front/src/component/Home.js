import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import {
  Grid,
  Responsive,
  Item,
  Image,
  Header,
  Loader,
  Card,
  Icon,
} from 'semantic-ui-react';

import '../css/Home.css';

import * as util from '../common/util';
import * as api from '../common/api';
import { ListoSource } from '../model/listo';
import Navbar from './Navbar';

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
        userBasedRepos: await Promise.all(((await api.getUserBasedRecommend()).rids || []).map(api.getRepoDetail)),
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
      <div className='repo-container' key={repo.id}>
        <Card href={repo.html_url} target="_blank" rel="noopener noreferrer">
          <Card.Content>
            <Card.Header className='home-repo-name'>
              <Image className='home-repo-avatar' circular src={(repo.owner && repo.owner.avatar_url) || ''}></Image>
              {repo.full_name}
            </Card.Header>
            <Card.Description>{repo.description}</Card.Description>
          </Card.Content>
          {
            basedOnRepo && (
              <Card.Content extra>
                <Icon name='heart' />
                because you liked {basedOnRepo.full_name}
              </Card.Content>
            )
          }
        </Card>
      </div>
    )
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
          <p>Sorry you don't have enough interactions on Github.</p>
          <p><a href="https://github.com/explore" target="_blank" rel="noopener noreferrer">Go star some repos you like and come back later</a></p>
        </Header>
      </div>
    );
  }

  renderLoading() {
    return <Loader active>Loading</Loader>;
  }

  render() {
    // const panes = [
    //   { menuItem: 'Item Based', render: () => this.renderItemBased() },
    //   { menuItem: 'User Based', render: () => this.renderUserBased() },
    // ];
    return (
      <React.Fragment>
        <Navbar />
        {/* <Tab menu={{ secondary: true }} panes={panes} /> */}
        <div className='recommendation-content-container'>
          {this.renderItemBased()}
        </div>
      </React.Fragment>
    );
  }

  renderItemBased() {
    if (this.state.listos.length === 0) {
      return this.state.reachedEnd ?
        this.renderNoRecommendAvailable() :
        this.renderLoading();
    }
    const colcnt = Math.max(Math.ceil(document.body.clientWidth / 400), 1);
    return (
      <Responsive onUpdate={() => this.forceUpdate()}>
        <Grid columns={colcnt} centered>
          {
            _.range(colcnt).map((col) => (
              <Grid.Column key={col}>
                {this.state.listos.filter((_, idx) => idx % colcnt === col).map(this.renderRecommendRepo)}
              </Grid.Column>
            ))
          }
        </Grid>
      </Responsive>
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
