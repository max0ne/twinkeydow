api-node
---

A bunch of node lambda apis put together in a single project, under a single express router.

## Routes

### [oauth](routes/oauth.js)
Handles Github OAuth code grant flow callback, do a token exchange, respond access_token to frontend.

### [user_rcmd](routes/user_rcmd.js)
Handles lookup of user based recommendations from `user_recommend` collection

## Deployment

1. make sure MongoDB is setup in mlab.com

1. setup environment variable file `env.yml`

1. 
```
npx sls deploy
```

## Environment Variable

1. GITHUB_OAUTH_STATE
> OAuth state, should match this variable in frontend project.

1. GITHUB_CLIENT_ID
> Get it from [Github App Setting](https://github.com/settings/apps/twin)

1. GITHUB_CLIENT_SECRET
> Get it from [Github App Setting](https://github.com/settings/apps/twin)

1. FRONT_END_URL
> URL of frontend page

1. MONGO_URL
> MongoDB url, including username, password, port, dbnames

1. MONGO_DB_NAME
> MongoDB db name
