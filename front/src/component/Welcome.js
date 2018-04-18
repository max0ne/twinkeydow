import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';

import '../css/Welcome.css';
import config from '../common/config';

export default class Welcome extends Component {
  render() {
    const githubOAuthURL = `${config.oauthLoginURL}?oauth_done_redirect=${encodeURIComponent(window.location.href)}`;
    return <Button as="a" href={githubOAuthURL}><Icon name="github"/>Login</Button>;
  }
}
