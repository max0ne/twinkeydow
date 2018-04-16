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

export async function githubTokenExchange(code) {
  const url = `https://github.com/login/oauth/access_token?client_id=${config.githubClientID}&client_secret=${config.githubClientSecret}&code=${code}`;
  return (await axios.post(url)).data.access_token;
}

export async function getUserBasedRecommend() {
  if (!ghToken) {
    throw new Error('github login required for `getUserBasedRecommend`');
  }
  return (await axios.get(`${config.userBasedRecommendURL}?ghToken=${ghToken}`)).data;
}

export async function getUser(access_token) {
  return (await ghClient.get(`/user?access_token=${access_token}`)).data
}

export async function getUserStars(page) {
  return (await ghClient.get('/user/starred')).data;
}

export async function getSimilar(rid) {
  return (await similarRepoClient.get(`/?rid=${rid}`)).data;
}

export async function getRepoDetail(rid) {
  return (await ghClient.get(`repositories/${rid}`)).data;
}
