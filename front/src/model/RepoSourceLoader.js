import * as api from '../common/api';
import _ from 'lodash';

export default class RepoSourceLoader {
  constructor() {
    this._pool = [];
    this._nextPageURL = undefined;
    this.reachedEnd = false;
  }

  /**
   * pop `nn` repos
   * @param {number} nn
   * @returns {[object]}
   */
  async pop(nn) {
    if (this.reachedEnd) {
      return [];
    }

    // try to get from in memory _pool
    if (this._pool.length >= nn) {
      return this._pool.splice(0, nn);
    }
    // load next page
    const { data, nextStarPageURL } = await api.getUserStars(this._nextPageURL);
    this.reachedEnd = this._nextPageURL === nextStarPageURL;
    this._nextPageURL = nextStarPageURL;
    this._pool.push(...data);
    return this._pool.splice(0, nn);
  }

  getRandom = () => {
    return this._pool[_.random(this._pool.length - 1)];
  }
}
