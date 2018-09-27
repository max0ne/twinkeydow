import * as api from '../common/api';
import _ from 'lodash';

class StarSource {
  constructor() {
    this._pool = [ ];
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

    // try to get from in memory pool
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
}

// recommendo
// {
//   from_rid,
//   to_rid,
//   score: 0~1,
//   reason: 'star' || 'show_more',
// }
//
// show_more_hando
// {
//   rid
// }
export class ListoSource {

  /**
   * @param {function} onUpdate callend whenever any state changes
   */
  constructor(onUpdate=() => { }) {

    this.onUpdate = onUpdate;
    this.starSource = new StarSource();
    this._recommendoPool = [];
    this._listos = [];
    this.reachedEnd = false;
    // rid -> repo object
    this.repoDetails = {};
  }

  listos() {
    return [...this._listos];
  }

  _populateRecommendoPool(from_rid, similars) {
    this._recommendoPool.push(...similars.map((sim) => ({
      from_rid,
      to_rid: sim.rid,
      score: sim.sim,
    })));
  }

  async _populateListo(recs) {
    // remove duplicates
    const listoRids = _.map(this._listos, 'to_rid').filter((rid) => !!rid);
    const nonDuplicateRecs = _.reject(recs, rec => _.includes(listoRids, rec.to_rid));

    // populate repo detail
    await Promise.all(nonDuplicateRecs.map(async (rec) => {
      // finally push processed rec object to result pool
      const repoDetail = await api.getRepoDetail(rec.to_rid).catch(() => undefined);
      if (!repoDetail) {
        return;
      }
      this.repoDetails[rec.to_rid] = repoDetail;
      this._listos.push(rec);
    }));
    this.onUpdate();
  }

  async showMoreOf(rid) {
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.onUpdate();
    try {
      await this._showMoreOf(rid);
    } catch (err) {
      console.error(err);
    }
    this.busy = false;
    this.onUpdate();
  }

  async _showMoreOf(rid) {
    const moreFromListPool = this._recommendoPool.filter((rec) => rec.from_rid === rid);
    if (moreFromListPool.length > 0) {
      this._listos = _.flatmap(this._listos, (listo) => {
        if (listo.to_rid === rid) {
          return [listo, ...moreFromListPool];
        }
        return [listo];
      });
      this.onUpdate();
      return;
    }

    const sims = await api.getSimilar(rid, this._listos.filter((listo) => listo.from_rid === rid).length);
    await this._populateListo(sims.map((sim) => ({
      from_rid: rid,
      to_rid: sim.rid,
      score: sim.sim,
    })));
  }

  _grow = async (nn) => {
    // 1. pop from local pool
    const recs = this._recommendoPool.splice(0, nn);
    if (recs.length === nn) {
      await this._populateListo(recs);
      return;
    } else if (recs.length > 0) {
      await this._populateListo(recs);
      nn -= recs.length;
    }

    // 2. if local pool not have enough, load more from starSource
    // since every star source can be flatmapped to 5 repos, pop `nn` star sources should be 
    // enough to populate nn*5 recommendo's into _recommendoPool
    const starRepos = await this.starSource.pop(nn);

    // keep starRepos object in repoDetails cache
    starRepos.forEach((sr) => this.repoDetails[sr.id] = sr);

    if (starRepos.length === 0) {
      this.reachedEnd = true;
      this.onUpdate();
    } else {
      // fire `getSimilar` on all starred repos concurrently, wait for all of them to finish then fulfill this grow
      await Promise.all(starRepos.map(async (sr) => {
        this._populateRecommendoPool(sr.id, await api.getSimilar(sr.id));
      }));
      await this._populateListo(this._recommendoPool.splice(0, nn));
    }
  }

  /**
   * @param {number} nn 
   * @param {function} then 
   */
  async grow(nn) {
    if (this.busy || this.reachedEnd) {
      return;
    }
    this.busy = true;
    this.onUpdate();
    try {
      await this._grow(nn);
    } catch (err) {
      console.error(err);
    }
    this.busy = false;
    this.onUpdate();
  }
}
