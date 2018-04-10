api_oauth_exchange
---

Handles Github OAuth code grant flow callback, do a token exchange, respond access_token to frontend.

## Deployment

1. setup environment variable file `env.yml`
1. 
```
npx serverless deploy
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
