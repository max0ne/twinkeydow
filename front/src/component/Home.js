import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import languageMap from 'language-map';

import {
  Grid,
  Visibility,
  Responsive,
  Image,
  Header,
  Loader,
  Label,
  Card,
  Icon,
} from 'semantic-ui-react';
import { Facebook as ContentLoader } from 'react-content-loader';

import '../css/Home.css';

import RepoLoader from '../model/RepoLoader';
import * as api from '../common/api';
import Navbar from './Navbar';

class Home extends Component {

  constructor() {
    super();
    this.state = {
      repoLangs: { },
    }
  }

  getRepoLanguages = async (repo) => {
    if (!_.has(this.state.repoLangs, repo.id)) {
      const langs = await api.getRepoLanguages(`${repo.owner.login}/${repo.name}`);
      
      this.setState((state) => ({
        ...state,
        repoLangs: {
          ...state.repoLangs,
          [repo.id]: langs,
        },
      }));
    }
  }

  renderRepo(idx, repo, basedOnRepo) {
    if (_.isNil(repo)) {
      return (
        <div className='repo-container' key={idx}>
          <Card>
            <ContentLoader />
            <Card.Content extra>
              <Icon name='sync' />
              It's loading...
            </Card.Content>
          </Card>
        </div>
      );
    }

    const langs = this.state.repoLangs[repo.id] || (repo.language ? { [repo.language]: 1 } : { });
    const firstLangs = Object.keys(langs)
      .filter((lang) => !_.isNil(lang))
      .sort((a, b) => langs[b] - langs[a]).slice(0, 2);

    return (
      <div className='repo-container' key={repo.id}>
        <Card href={repo.html_url} target="_blank" rel="noopener noreferrer">
          <Card.Content>
            <Card.Header className='home-repo-name'>
              <Image className='home-repo-avatar' circular src={(repo.owner && repo.owner.avatar_url) || ''}></Image>
              {repo.full_name}
            </Card.Header>
            {
              firstLangs.map((lang) => (
                <Label
                  key={lang}
                  style={{ background: (languageMap[lang] || {}).color, color: 'white' }}
                  size='tiny'
                  >{lang}</Label>
              ))
            }
            <Card.Description>{repo.description}</Card.Description>
          </Card.Content>
          {
            basedOnRepo && (
              <Card.Content extra>
                <Icon name='heart' />
                similar to {basedOnRepo.full_name}
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
    return (
      <React.Fragment>
        <Navbar />
        <div className='recommendation-content-container'>
          {this.renderItemBased()}
        </div>
      </React.Fragment>
    );
  }

  renderItemBasedWithData = ({ loadMore, repoDetails, recommends, loading }) => {
    if (recommends.length === 0) {
      return loading ? this.renderLoading() : this.renderNoRecommendAvailable();
    }
    const colcnt = Math.max(Math.ceil(document.body.clientWidth / 400), 1);
    // load 3 more rows very time
    loadMore = loadMore.bind(colcnt * 3);
    return (
      <Responsive onUpdate={() => this.forceUpdate()}>
        <Grid columns={colcnt} centered>{
            _.range(colcnt).map((col) => (
              <Grid.Column key={col}>{
                recommends
                  .filter((_, idx) => idx % colcnt === col)
                  .map((rec, idx) => this.renderRepo(idx, repoDetails[rec.to_rid], repoDetails[rec.from_rid]))
              }</Grid.Column>
            ))
        }</Grid>
        <Visibility offset={[10, 100]} onOnScreen={loadMore} once={false} fireOnMount={true}>
          <Card.Group>
            <Card color='orange' style={{ height: 50 }} onClick={loadMore} centered>
              {
                loading ? <Loader active={true} /> : <Card.Content>Load More</Card.Content>
              }
            </Card>
          </Card.Group>
        </Visibility>
      </Responsive>
    );
  }

  renderItemBased() {
    return (
      <RepoLoader>{this.renderItemBasedWithData}</RepoLoader>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
