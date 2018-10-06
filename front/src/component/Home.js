import React, { Component } from 'react';
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
import RepoDetailLoader from '../model/RepoDetailLoader';

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

  renderRecommendation(idx, recomend, repoDetails, repoStates, loadRepoDetail) {
    if (!repoDetails[recomend.from_rid]) {
      loadRepoDetail(recomend.from_rid);
    }
    if (!repoDetails[recomend.to_rid]) {
      loadRepoDetail(recomend.to_rid);
      return (
        <div className='repo-container' key={idx}>
          <Card className='repo-card'>
            <ContentLoader />
            <Card.Content extra>
              <Icon name='sync' />
              It's loading...
            </Card.Content>
          </Card>
        </div>
      );
    }

    const repo = repoDetails[recomend.from_rid];
    const basedOnRepo = repoDetails[recomend.to_rid];

    const langs = this.state.repoLangs[repo.id] || (repo.language ? { [repo.language]: 1 } : { });
    const firstLangs = Object.keys(langs)
      .filter((lang) => !_.isNil(lang))
      .sort((a, b) => langs[b] - langs[a]).slice(0, 2);

    return (
      <div className='repo-container' key={repo.id}>
        <Card className='repo-card' href={repo.html_url} target="_blank" rel="noopener noreferrer">
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

  renderItemBasedWithData = ({ loadRepoDetail, repoDetails, repoStates }) => ({ loadMore, recommends, loading }) => {
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
                .map((rec, idx) => this.renderRecommendation(idx, rec, repoDetails, repoStates, loadRepoDetail))
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
      <RepoDetailLoader>
        {({ loadRepoDetail, setRepoDetails, repoDetails, repoStates }) =>
          <RepoLoader setRepoDetails={setRepoDetails}>
            {this.renderItemBasedWithData({ loadRepoDetail, repoDetails, repoStates })}
          </RepoLoader>}
      </RepoDetailLoader>
    );
  }
}

export default Home;
