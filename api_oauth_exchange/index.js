const serverless = require('serverless-http');
const express = require('express')
const axios = require('axios').default;
const app = express()

const envMust = (key, must) => {
  const val = process.env[key];
  if (must && !val) {
    console.error('env key', key, 'missing');
    process.exit('1');
  }
  return val;
};

const GITHUB_OAUTH_STATE = envMust('GITHUB_OAUTH_STATE', true);
const GITHUB_CLIENT_ID = envMust('GITHUB_CLIENT_ID', true);
const GITHUB_CLIENT_SECRET = envMust('GITHUB_CLIENT_SECRET', true);
const FRONT_END_URL = envMust('FRONT_END_URL', true);

async function githubTokenExchange(code) {
  const url = `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`;
  return (await axios.post(url, undefined, {
    headers: {
      Accept: 'application/json',
    },
  })).data;
}

app.all('/', async function (req, res) {

  const sendOK = (access_token) => {
    console.log('ok', access_token);
    res.redirect(`${FRONT_END_URL}?success=true&access_token=${access_token}`);
  }

  const sendErr = (msg) => {
    console.error('err', msg);
    res.redirect(`${FRONT_END_URL}?success=false&msg=${msg}`);
  }

  if (req.query.state !== GITHUB_OAUTH_STATE) {
    return sendErr('state error');
  }

  const code = req.query.code;
  if (!code) {
    return sendErr('oauth code not found');
  }

  try {
    const data = await githubTokenExchange(code);
    const { access_token, error } = data;
    if (access_token) {
      return sendOK(access_token);
    } else {
      return sendErr(error || JSON.stringify(data))
    }
  }
  catch (err) {
    return sendErr(err.toString());
  }
})

module.exports.handler = serverless(app);
