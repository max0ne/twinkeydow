api-node
---

A bunch of node lambda apis put together in a single project, under a single express router.

## Routes

### [oauth login](routes/oauth.js)
Handles Github OAuth code grant flow callback, do a token exchange, respond access_token to frontend.

### [user_rcmd](routes/user_rcmd.js)
Handles lookup of user based recommendations from `user_recommend` collection

## Deployment

1. make sure MongoDB is setup in mlab.com

1. [setup credentials in AWS Secret Manager](https://github.com/max0ne/twinkeydow/wiki/AWS-Secret-Manger)

1. 
```
npx sls deploy
```

## Local Development
```
npx sls offline start --port 4000
```

## Environment Variable
- DEFAULT_FRONT_END_URL
> Frontend to redirect to after OAuth if unable to find original frontend url from cookie, this happens sometimes when using incognito mode.

- SERVICE_BASE_URL
> The api-gateway url that this api is hosted on, only known after first deployment

## AWS Secrets Manager Managed Variables

- secret `github_oauth`
  - GITHUB_OAUTH_STATE
  > OAuth state, should match this variable in frontend project.

  - GITHUB_CLIENT_ID
  > Get it from [Github App Setting](https://github.com/settings/apps/twin)

  - GITHUB_CLIENT_SECRET
  > Get it from [Github App Setting](https://github.com/settings/apps/twin)

- secret `mongodb_credential`
  - MONGO_URL
  > MongoDB url, including username, password, port, dbnames

  - MONGO_DB_NAME
  > MongoDB db name
