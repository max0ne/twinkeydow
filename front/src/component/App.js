import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createBrowserHistory } from 'history'
import '../css/App.css';

import { ToastContainer } from 'react-toastify';
import * as urlParse from 'url-parse';

import * as middleware from '../redux/middleware';
import * as api from '../common/api';
import env from '../env';

import Home from './Home';
import OAuth_callback from './OAuth_callback';
import Welcome from './Welcome';
import Navbar from './Navbar';
 
import {
  Router,
  Switch,
  Route
} from 'react-router-dom';
import { toastError } from '../common/util';

class App extends Component {

  constructor() {
    super();
    this.history = createBrowserHistory({
      basename: env.basename,
    });
  }
  
  async componentWillMount() {
    const gotoWelcome = () => {
      if (urlParse(window.location.href).pathname !== 'welcome') {
        this.history.push('/welcome');
      }
    };
    const gotoHome = () => {
      if (urlParse(window.location.href).pathname !== 'home') {
        this.history.push('/home');
      }
    };

    try {
      const access_token = 
        urlParse(window.location.href, true).query.access_token ||
        middleware.loadGithubTokenFromLocalStorage();
      if (!access_token) {
        return gotoWelcome();
      }

      // if token presents, set it to api first
      // valid token later
      this.props.dispatch({
        type: 'SET_GH_USER',
        access_token,
      });

      const user = await api.getUser(access_token);
      this.props.dispatch({
        type: 'SET_GH_USER',
        access_token,
        user,
      });
      gotoHome();
    }
    catch (err) {
      console.log(err);
      return gotoWelcome();
    }

    //  no ui for this so just put it here for now
    this.getUserBasedRecommends();
  }

  async getUserBasedRecommends() {
    try {
      console.log('user based recommends', await api.getUserBasedRecommend());
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    return (
      <div className="app">
        <ToastContainer position='top-center' hideProgressBar={true} />
        <Navbar />
        <Router basename={env.basename} history={this.history}>
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/welcome" component={Welcome} />
            <Route path="/oauth_done" component={OAuth_callback} />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default connect()(App);
