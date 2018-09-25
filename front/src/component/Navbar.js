import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Image, Menu, Popup } from 'semantic-ui-react';

class Navbar extends Component {

  constructor() {
    super();
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleLogout() {
    this.props.dispatch({
      type: 'SET_GH_USER',
      access_token: undefined,
      user: undefined,
    });
    window.location.href = '/';
  }

  renderUserAvatar() {
    return (
      <div>
        <Menu.Item >
          <Image size="mini" circular src={this.props.user.avatar_url} />
        </Menu.Item>
      </div>
    );
  }

  renderLoggedIn() {
    return (
      <Popup wide trigger={this.renderUserAvatar()} on='click' position='bottom center' >
        <Menu fluid vertical>
          <Menu.Item onClick={this.handleLogout}>Logout</Menu.Item>
        </Menu>
      </Popup>
    );
  }

  renderNotLogIn() {
    // not used for now
    return (
      null
    );
  }

  render() {
    return (
      <div>
        <Menu pointing secondary>
          <Menu.Item name='Twinkeydow' as='a' href={process.env.REACT_APP_BASE_PATH} />
          <Menu.Menu position='right'>
            {
              this.props.user ? this.renderLoggedIn() : this.renderNotLogIn()
            }
          </Menu.Menu>
        </Menu>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Navbar);
