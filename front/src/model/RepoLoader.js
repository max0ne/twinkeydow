import React from 'react';
import _ from 'lodash';

import RepoSourceLoader from './RepoSourceLoader';
import RepoSimilarLoader from './RepoSimilarLoader';

export default class RepoLoader extends React.Component {
  constructor(props) {
    super(props);

    this.sourceLoader = new RepoSourceLoader();
    this.similarLoader = new RepoSimilarLoader();

    this.state = {
      // list of RepoSimilar objects
      recommends: [ ],

      loading: false,
    };
    this.loading = false;
  }

  componentDidMount = () => {
    this.loadMore(10);
  }

  loadMore = async (nn) => {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.setState({ loading: true });
    try {
      let tries = 10;
      const newRecommends = [];
      while (true) {
        const batch = await this._loadMore();
        newRecommends.push(...batch);
        this.setState({
          recommends: [...this.state.recommends, ...newRecommends],
        });
        if (--tries === 0 || newRecommends.length >= nn) {
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
    this.setState({ loading: false });
    this.loading = false;
  }

  _loadMore = async () => {
    // 1. get some source repos to find similar from
    let sourceRepoIDs = [];

    if (!this.sourceLoader.reachedEnd) {
      // if theres still unused source
      // load the source and load some similar ones from that source
      const newSourceRepos = await this.sourceLoader.pop(10);

      // store these new sources into states
      this.props.setRepoDetails(newSourceRepos);

      sourceRepoIDs = _.map(newSourceRepos, 'id');
    } else {
      // if no more source to read from
      // start reading similar repos of given repos on ui
      // randomly pick 5 previously used repos
      const from_rids = [...new Set(_.map(this.state.recommends, 'from_rid'))];
      sourceRepoIDs = _.range(5).map(() => from_rids[_.random(from_rids.length - 1)]);
    }

    // load similars for each of these source repo ids
    const newSimilars = [];
    await Promise.all(sourceRepoIDs.map(async (rid) => {
      const similars = await this.similarLoader.loadMoreOf(rid);
      newSimilars.push(...similars.map((sim) => ({
        from_rid: rid,
        to_rid: sim.rid,
        score: sim.sim,
      })));
    }));

    // remove ones that are already on ui (similar repo conflicted from other repos)
    const existingSimilars = new Set(_.map(this.state.recommends, 'to_rid'));
    const res = _.uniqBy(newSimilars, 'to_rid').filter((sim) => !existingSimilars.has(sim.to_rid));
    return res;
  }

  render() {
    return this.props.children({
      loadMore: this.loadMore,
      recommends: this.state.recommends,
      loading: this.state.loading,
    });
  }
}
