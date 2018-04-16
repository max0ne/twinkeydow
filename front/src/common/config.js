export default {
  frontendBaseURL: 'http://localhost:3000',
  githubClientID: 'c1374dcd8168bbe8cb1d',

  oauthCallbackPath: '/oauth_done',

  // url of backend service to do oauth token exchange
  oauthRedirectURL: 'https://zt4r2xqfmb.execute-api.us-east-1.amazonaws.com/dev/oauth',

  userBasedRecommendURL: 'https://zt4r2xqfmb.execute-api.us-east-1.amazonaws.com/dev/user_rcmd',

  // should match `api_oauth_exchange/env.yml`
  githubOauthState: 'pispMrpkKVhCaH8Akk',

  similarRepoAPIURL: 'https://x72omd1he6.execute-api.us-east-1.amazonaws.com/dev/repo/similar',
};
