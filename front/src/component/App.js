import React, { Component } from 'react';
import '../css/App.css';

import Home from './Home';
import OAuth_callback from './OAuth_callback';
import Welcome from './Welcome';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/welcome" component={Welcome} />
          <Route path={`/oauth_callback`} component={OAuth_callback} />
        </Switch>
      </Router>
    );
  }
}

export default App;
