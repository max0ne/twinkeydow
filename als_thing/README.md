try this thing https://medium.com/@HubbaDev/building-a-recommendation-engine-with-aws-data-pipeline-elastic-mapreduce-and-spark-ad886b0a1434

### Usage

0. install dependencies
```
npm i
```

1. those node stuff requires node 8 or higher, update your node runtime if `node --version` returns lower than 8.0

2. get your starred repos, it's gonna format your stars to csv, save it to `data/user.csv`
```
./node_modules/.bin/ts-node get_stars.ts > data/user.csv
```

3. run spark thing, before you need to install bunch of spark dependencies.
```
brew update
brew install apache-spark

# in either ~/.bash_profile or ~/.profile
export SPARK_HOME=/usr/local/Cellar/apache-spark/1.6.1/libexec
source ~/.bash_profile (or ~/.profile)

pip install findspark jupyter
```

4. Launch IPython with:

```
jupyter notebook
```

5. run through the entire ipython thing, it's gonna walk you over with how it's creating recommendation for your user. it's using `data/train.csv` which contains 155k star records made by 1.6k users.

6. At end of jupyter thing it's gonna spit out a list of recommendation repo ids, copy the entire array, paste it into a json file, name it `recommend_repoids.json`

7. use another node script to find repo content of those repo ids
```
./node_modules/.bin/ts-node get_repos.ts recommend_repoids.json
```
