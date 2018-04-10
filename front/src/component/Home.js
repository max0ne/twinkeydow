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
    
    const userStarIds = _.map(userStars, 'id');
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

  render() {
    return (
      <div>
        <pre>{JSON.stringify(this.state.userStars, undefined, 2)}</pre>
        <pre>{JSON.stringify(this.state.recommends, undefined, 2)}</pre>
      </div>
      // <Item.Group>
      //   <Item>
      //     <Item.Image size='tiny' src='/assets/images/wireframe/image.png' />

      //     <Item.Content>
      //       <Item.Header as='a'>Header</Item.Header>
      //       <Item.Meta>Description</Item.Meta>
      //       <Item.Description>
      //         <Image src='/assets/images/wireframe/short-paragraph.png' />
      //       </Item.Description>
      //       <Item.Extra>Additional Details</Item.Extra>
      //     </Item.Content>
      //   </Item>

      //   <Item>
      //     <Item.Image size='tiny' src='/assets/images/wireframe/image.png' />

      //     <Item.Content>
      //       <Item.Header as='a'>Header</Item.Header>
      //       <Item.Meta>Description</Item.Meta>
      //       <Item.Description>
      //         <Image src='/assets/images/wireframe/short-paragraph.png' />
      //       </Item.Description>
      //       <Item.Extra>Additional Details</Item.Extra>
      //     </Item.Content>
      //   </Item>
      // </Item.Group>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Home);
