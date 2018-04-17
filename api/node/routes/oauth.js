const common = require('../common/common');
const githubAPI = require('../common/github_api');

const SERVICE_BASE_URL = 'http://localhost:4000';

/**
 * handles oauth callback from github
 * performs a token exchange
 * redirect to frontend with token as parameter
 * 
 * @param {Express.Request} req
 * @param {Express.Response} res
 * 
 * @return {Promise<any>}
 */
async function handleOauthCallback(req, res) {
  let { oauth_done_redirect } = req.cookies;
  if (!oauth_done_redirect) {
    return res.status(500).send('oauth_done_redirect in cookie missing');
  }
  if (oauth_done_redirect.endsWith('/')) {
    oauth_done_redirect = ''.slice(0, oauth_done_redirect.lenth - 1);
  }

  const sendOK = (access_token) => {
    console.log('ok', access_token);
    res.redirect(`${oauth_done_redirect}?success=true&access_token=${access_token}`);
  };

  const sendErr = (msg) => {
    console.error('err', msg);
    res.redirect(`${oauth_done_redirect}?success=false&msg=${msg}`);
  };

  const code = req.query.code;
  if (!code) {
    return sendErr('oauth code not found');
  }

  const GITHUB_CLIENT_ID = await common.secretMust('github_oauth', 'GITHUB_CLIENT_ID', true);
  const GITHUB_CLIENT_SECRET = await common.secretMust('github_oauth', 'GITHUB_CLIENT_SECRET', true);
  const GITHUB_OAUTH_STATE = await common.secretMust('github_oauth', 'GITHUB_OAUTH_STATE', true);

  if (req.query.state !== GITHUB_OAUTH_STATE) {
    return sendErr('state error');
  }

  try {
    const data = await githubAPI.tokenExchange(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code);
    const { access_token, error } = data;
    if (access_token) {
      return sendOK(access_token);
    } else {
      return sendErr(error || JSON.stringify(data));
    }
  } catch (err) {
    return sendErr(err.toString());
  }
}

/**
 *
 * redirect to github oauth login url
 * 
 * @param {Express.Request} req
 * @param {Express.Response} res
 *
 * @return {void}
 */
async function handleOauthLogin(req, res) {
  // the frontend url to redirect to when oauth is finished
  // this is saved into cookie
  const oauth_done_redirect = req.query.oauth_done_redirect || req.headers.referer;

  const GITHUB_CLIENT_ID = await common.secretMust('github_oauth', 'GITHUB_CLIENT_ID', true);
  const GITHUB_OAUTH_STATE = await common.secretMust('github_oauth', 'GITHUB_OAUTH_STATE', true);

  // the backend url for github to redirect to after oauth
  const redirectURL = `${SERVICE_BASE_URL}/oauth_callback`;
  res.cookie('oauth_done_redirect', oauth_done_redirect);
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&type=user_agent&redirect_uri=${redirectURL}&state=${GITHUB_OAUTH_STATE}`);
}

module.exports = {
  handleOauthCallback,
  handleOauthLogin,
};
