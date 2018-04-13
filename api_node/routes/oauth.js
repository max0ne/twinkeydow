const common = require('../common/common');
const githubAPI = require('../common/github_api');

const GITHUB_OAUTH_STATE = common.envMust('GITHUB_OAUTH_STATE', true);
const GITHUB_CLIENT_ID = common.envMust('GITHUB_CLIENT_ID', true);
const GITHUB_CLIENT_SECRET = common.envMust('GITHUB_CLIENT_SECRET', true);
const FRONT_END_URL = common.envMust('FRONT_END_URL', true);


async function handle(req, res) {
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
    const data = await githubAPI.tokenExchange(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code);
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
}

module.exports = handle;
