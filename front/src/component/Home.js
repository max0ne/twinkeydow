import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { Image, Item } from 'semantic-ui-react';

import * as api from '../common/api';
import * as util from '../common/util';

class Home extends Component {

  constructor() {
    super();
    this.state = {
      // list of user starred repos
      userStars: [],

      // recommendation
      // [user starred repo id]: [recommend repo objects]
      recommends: { },
    }
  }
  
  async componentWillMount() {
    try {
      await this.getUserStarredRepos();
    }
    catch (err) {
      console.error(err);
    }
  }

  async getUserStarredRepos() {
    const userStars = await api.getUserStars();
    this.setState({ userStars });
    
    const userStarIds = _.map(userStars, 'id').filter((_, idx) => idx === 0);
    userStarIds.forEach(async (rid) => {
      const similars = await api.getSimilar(rid);
      similars.forEach(async (simObj) => {
        const similarRepo = await api.getRepoDetail(simObj.rid);
        this.setState({
          recommends: {
            ...this.state.recommends,
            rid: [
              ...(this.state.recommends[rid] || []),
              {
                rid: simObj.rid,
                repo: similarRepo,
                sim: simObj.sim,
              },
            ],
          },
        });
      });
    });
  }

  renderUserStar(repo) {
    return (
      <Item key={repo.id}>
        <Item.Image size='tiny' src={(repo.owner || {}).avatar_url} circular={true} />
        <Item.Content>
          <Item.Header as='a' href={repo.url}>{repo.full_name}</Item.Header>
          <Item.Meta>{`${repo.owner.login}/${repo.description}`}</Item.Meta>
          <Item.Extra>{(repo.topics || []).join(' ')}</Item.Extra>
        </Item.Content>
      </Item>
    );
  }

  render() {
    return (
      <Item.Group>
        {
          this.state.userStars.map(this.renderUserStar)
        }
      </Item.Group>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
