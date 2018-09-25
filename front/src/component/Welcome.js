import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import _ from 'lodash';

import '../css/Welcome.css';
import config from '../common/config';

export default class Welcome extends Component {
  render() {
    const madeBys = [
      { href: '', name: 'Changxing' },
      { href: '', name: 'Chenchen' },
      { href: 'https://mingfei.me/', name: 'Mingfei' },
      { href: '', name: 'Xinglun' },
    ];
    const githubOAuthURL = `${config.oauthLoginURL}?oauth_done_redirect=${encodeURIComponent(window.location.href)}`;
    return (
      <div className='welcome-container'>
        <h1 className='welcome-logo'>
          <span role='img' aria-label='welcome'>🙋</span> hi welcome to project Twinkeydow
        </h1>
        <h5>it gives you personalized Github repo recommendations</h5>
        <br />
        <br />
        <Button as="a" href={githubOAuthURL}><Icon name="github" />
          Try it!<br />
          Login through Github
        </Button>
      </div>
    );
  }
}
