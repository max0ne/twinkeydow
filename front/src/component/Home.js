import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import _ from 'lodash';

import { Item, Rating, Popup, Header, Icon } from 'semantic-ui-react';

import * as api from '../common/api';
import * as util from '../common/util';

class Home extends Component {

  constructor() {
    super();
    this.state = {
      // list of user starred repo objects
      userStars: [],

      // recommendation
      // { basedOn: rid, score: number, rid: string }
      recommends: [],

      // rid -> repo detail
      repoDetails: { },

      noRecommendAvailable: false,
    }

    this.renderRecommendRepo = this.renderRecommendRepo.bind(this);
    this.populateSimilarRepo = this.populateSimilarRepo.bind(this);
  }
  
  async componentWillMount() {
    try {
      await this.populateUserStarredRepos();
    }
    catch (err) {
      util.toastError(err);
    }
  }

  async populateUserStarredRepos() {
    const userStars = await api.getUserStars();
    this.setState({ userStars });

    if (userStars.length === 0) {
      this.setState({
        noRecommendAvailable: true,
      });
    }

    _.map(userStars, 'id').forEach(this.populateSimilarRepo);
  }

  async populateSimilarRepo(rid) {
    const similars = await api.getSimilar(rid);
    if (similars.length === 0) {
      this.setState({
        noRecommendAvailable: true,
      });
    } else {
      this.setState({
        noRecommendAvailable: false,
      });
    }

    // do it in sequence hence for...of
    for (const simObj of similars) {
      try {
        // already recommended this repo based on some other repo
        if (this.state.recommends.some((recommend) => recommend.rid === simObj.rid)) {
          continue;
        }
        if (this.state.userStars.some((repo) => repo.id === simObj.rid)) {
          continue;
        }

        const repoDetail = await api.getRepoDetail(simObj.rid);
        this.setState({
          recommends: [
            ...this.state.recommends,
            {
              basedOn: rid,
              score: simObj.sim,
              rid: simObj.rid,
            },
          ],
          repoDetails: {
            ...this.state.repoDetails,
            [simObj.rid]: repoDetail,
          },
        });
      }
      catch (err) { console.error(err); }
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
   * @param {object} recommend
   * @param {string} recommend.rid
   * @param {number} recommend.score
   * @param {string} recommend.basedOn
   */
  renderRecommendRepo(recommend) {
    const recommendRepo = this.state.repoDetails[recommend.rid];
    const basedOnRepo = this.state.userStars.find((repo) => repo.id === recommend.basedOn);
    const repoView = (
      <Item key={recommendRepo.id}>
        <Item.Image size='tiny' src={(recommendRepo.owner || {}).avatar_url} circular={true} />
        <Item.Content>
          <Item.Meta>
            because you liked <a href={basedOnRepo.html_url} target="_blank">{basedOnRepo.full_name}</a>
            <Popup position='right center' trigger={<Rating disabled={true} icon='star' rating={recommend.score * 5} maxRating={5} />}>
              <Popup.Content>
                {recommend.score * 5} / 5
              </Popup.Content>
            </Popup>
          </Item.Meta>
          <Item.Header as='a' href={recommendRepo.html_url} target="_blank">{recommendRepo.full_name}</Item.Header>
          <Item.Meta>{`${recommendRepo.owner.login}/${recommendRepo.description}`}</Item.Meta>
          <Item.Extra>{(recommendRepo.topics || []).join(' ')}</Item.Extra>
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
            🤷
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

  render() {
    if (this.state.noRecommendAvailable) {
      return this.renderNoRecommendAvailable();
    }
    return (
      <Item.Group>
        {
          this.state.recommends.map(this.renderRecommendRepo)
        }
      </Item.Group>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
