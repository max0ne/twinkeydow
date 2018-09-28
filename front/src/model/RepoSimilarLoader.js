import * as api from '../common/api';
import _ from 'lodash';

export default class RepoSimilarLoader {
  constructor() {
    // loaded similar repos
    // key being repoid, value being array of similar repoids
    this.similarRepos = { };
    
    // state of each rid of every key in similarRepos
    // state can either be loading or loaded
    this.repoStates = { };
  }

  loadMoreOf = async (rid) => {
    this.repoStates[rid] = 'loading';
    this.similarRepos[rid] = this.similarRepos[rid] || [];
    
    const similars = await api.getSimilar(rid, _.size(this.similarRepos[rid]));
    this.similarRepos[rid].push(...similars);
    this.repoStates[rid] = 'loaded';

    return similars;
  }
}
