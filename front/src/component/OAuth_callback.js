import React, { Component } from 'react';
import { connect } from 'react-redux';

import * as urlParse from 'url-parse';

import * as util from '../common/util';
import * as api from '../common/api';

class OAuth_callback extends Component {

  async componentWillMount() {
    try {
      const code = urlParse(window.location.href, true).query.code;
      const access_token = await api.githubTokenExchange(code);
      const user = await api.getUser(access_token);

      this.props.dispatch({
        type: 'SET_GH_USER',
        access_token,
        user,
      });

      setTimeout(() => {
        this.props.history.push('/');
      }, 1000);
    }
    catch (err) {
      util.toastError(err);
    }
  }

  render() {
    return <div />;
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect()(OAuth_callback);
