import axios from 'axios';
import config from './config';

export const ghClient = axios.create({
  baseURL: "https://api.github.com",
});

export const setGithubToken = (token) => {
  ghClient.defaults.headers["Authorization"] = `Bearer ${token}`;
}

export async function githubTokenExchange(code) {
  const url = `https://github.com/login/oauth/access_token?client_id=${config.githubClientID}&client_secret=${config.githubClientSecret}&code=${code}`;
  return (await axios.post(url)).data.access_token;
}

export async function getUser(access_token) {
  return (await ghClient.get(`/user?access_token=${access_token}`)).data
}
