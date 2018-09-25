import axios from 'axios';
import config from './config';

/**
 * github token
 * @type {string}
 */
let ghToken = undefined;
export const ghClient = axios.create({
  baseURL: "https://api.github.com",
});

export const similarRepoClient = axios.create({
  baseURL: config.similarRepoAPIURL,
});

export const setGithubToken = (token) => {
  ghClient.defaults.headers["Authorization"] = `Bearer ${token}`;
  ghToken = token;
}

export async function getUserBasedRecommend() {
  if (!ghToken) {
    throw new Error('github login required for `getUserBasedRecommend`');
  }
  return (await axios.get(`${config.userBasedRecommendURL}?limit=20&ghToken=${ghToken}`)).data;
}

export async function getUser(access_token) {
  return (await ghClient.get(`/user?access_token=${access_token}`)).data
}

function parseLink(link) {
  // '<https://api.github.com/events?page=2>; rel="next", <https://api.github.com/events?page=10>; rel="last"'
  const [, url1, tag1, url2, tag2] = link.split(/<(.+?)>;\s*rel="(.+?)",\s*<(.+?)>;\s*rel="(.+?)"/);
  return {
    [tag1]: url1,
    [tag2]: url2,
  };
}

export async function getUserStars(nextPageURL) {
  const resp = await ghClient.get(nextPageURL || '/user/starred?page=1');
  const { next, last } = parseLink(resp.headers.link || '');
  return {
    data: resp.data,
    nextStarPageURL: last === nextPageURL ? undefined : next,
  };
}

export async function getSimilar(rid, offset = 0, limit = 5) {
  const sims = (await similarRepoClient.get(`/?rid=${rid}&limit=${offset + limit}`)).data;
  return sims.slice(offset, sims.length);
}

export async function getRepoDetail(rid) {
  return (await ghClient.get(`repositories/${rid}`)).data;
}

export async function getRepoLanguages(repoIdentifier) {
  return (await ghClient.get(`/repos/${repoIdentifier}/languages`)).data;
}
