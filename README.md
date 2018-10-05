[![Build Status](https://img.shields.io/circleci/project/gh/max0ne/twinkeydow/master.svg
)](https://circleci.com/gh/max0ne/twinkeydow/tree/master)
[![Build Status](https://img.shields.io/circleci/project/gh/max0ne/twinkeydow/dev.svg
)](https://circleci.com/gh/max0ne/twinkeydow/tree/dev)
[![Build Status](https://img.shields.io/circleci/project/gh/max0ne/twinkeydow.svg
)](https://circleci.com/gh/max0ne/twinkeydow)

# Project Twinkeydow

It provides customized Github repo recommendations, based on your previous activities on Github. It works by pulling large number of public Github user data from [Github Public Event API](https://developer.github.com/v3/activity/events/), modeling each Github repo by [model based collaborative filtering](https://en.wikipedia.org/wiki/Collaborative_filtering#Model-based) and provide customized recommendations.

## Structure

The code mainly does 5 things

| wat | deployed to | tools | wat exactly |
| - |-|-|-|
| [Gathering Data](./github_repo_puller) | AWS EC2 | Node.js | Querying Github API for public activity |
| [Modeling](./als_thing/compute_feature_vector.ipynb) | AWS EMR | Python, Spark | CF modeling stuff given bunch of data to train with |
| [Predicting](./api/sim_repo) | AWS Lambda | Python, Serverless | KNN over repo feature vectors with NumPy |
| [API Hosting](./api/node) | AWS Lambda | TypeScript, Node.js, Serverless | generic web API services, handle misc stuff like OAuth, user authentication |
| [UI](./front) | Github Pages / S3 | React, CSS, Semantic UI | UI stuff |
