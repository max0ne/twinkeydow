const axios = require('axios').default;
const client = axios.create({
  baseURL: 'https://api.github.com',
});

async function tokenExchange(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code) {
  const url = `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`;
  return (await axios.post(url, undefined, {
    headers: {
      Accept: 'application/json',
    },
  })).data;
}

async function getUser(token) {
  return (await client.get(`/user?access_token=${token}`)).data;
}

module.exports = {
  tokenExchange,
  getUser,
};
