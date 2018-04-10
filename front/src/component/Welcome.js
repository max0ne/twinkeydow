import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';

import '../css/Welcome.css';
import config from '../common/config';
import * as api from '../common/api';

export default class Welcome extends Component {
  render() {
    const githubOAuthURL = 
      `https://github.com/login/oauth/authorize?client_id=${config.githubClientID}&type=user_agent&redirect_uri=${config.frontendBaseURL + config.oauthCallbackPath}&state=${config.githubOauthState}`
    return <Button as="a" href={githubOAuthURL}><Icon name="github"/>Login</Button>;
  }
}
