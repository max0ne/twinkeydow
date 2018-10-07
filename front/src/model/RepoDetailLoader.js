import React from 'react';
import * as api from '../common/api';

export default class RepoDetailLoader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      repoDetails: { },
      repoStates: { },
    };
  }

  loadRepoDetail = async (rid) => {
    if (!this.state.repoStates[rid] || this.state.repoStates[rid] === 'failed') {
      try {
        this.setState((state) => ({
          ...state,
          repoStates: {
            ...state.repoStates,
            [rid]: 'loading',
          },
        }));
        const repoDetail = await api.getRepoDetail(rid);
        this.setRepoDetails([repoDetail]);
      } catch (err) {
        this.setState((state) => ({
          ...state,
          repoStates: {
            ...state.repoStates,
            [rid]: err ? err.toString() : `Failed to load repo ${rid}`,
          },
        }));
      }
    } else {
      return this.state.repoDetails[rid];
    }
  }

  setRepoDetails = async (repoDetails) => {
    const newRepoDetails = { };
    const newRepoStates = { };
    repoDetails.forEach((repo) => {
      newRepoDetails[repo.id] = repo;
      newRepoStates[repo.id] = 'loaded';
    });
    this.setState((state) => ({
      ...state,
      repoDetails: {
        ...state.repoDetails,
        ...newRepoDetails,
      },
      repoStates: {
        ...state.repoStates,
        ...newRepoStates,
      },
    }));
  }

  render() {
    return this.props.children({
      loadRepoDetail: this.loadRepoDetail,
      setRepoDetails: this.setRepoDetails,
      repoDetails: this.state.repoDetails,
      repoStates: this.state.repoStates,
    });
  }
}
