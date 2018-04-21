const TokenManager = require("./js/token.js")
const assert = require('assert').strict;
const MongoClient = require('mongodb').MongoClient;
const querystring = require('querystring');
const request = require('request');
const linkParser = require('parse-link-header');
const Counter = require("./js/counter.js")
const fs = require('fs');
const AWS = require('aws-sdk')
const s3 = new AWS.S3();

var client = new AWS.SecretsManager({
    endpoint: "https://secretsmanager.us-east-1.amazonaws.com",
    region: "us-east-1"
});


(run = async function(){
  let secret = await new Promise(function(resolve, reject) {
    client.getSecretValue({SecretId: "mongodb_credential"}, function(err, data) {
      if(err) reject(err)
      else resolve(data)
    });
  })

  let secret2 = await new Promise(function(resolve, reject) {
    client.getSecretValue({SecretId: "github_api_token"}, function(err, data) {
      if(err) reject(err)
      else resolve(data)
    });
  })

  var dbConfig = JSON.parse(secret.SecretString)
  var apiConfig = JSON.parse(secret2.SecretString)


  const MONGO_URL = dbConfig.MONGO_URL
  const MONGO_DB_NAME = dbConfig.MONGO_DB_NAME
  const API_TOKENS = apiConfig.GITHUB_API_TOKEN

  const COLLECTION_NAME = "user_recommend"
  const API_ENDPOINT = "https://api.github.com"
  const API_SUBFIX = "/user/:uid/starred"
  const OUTPUT_FILE_NAME = "registerd_user_star_repo.csv"


  var tokenManager = new TokenManager(API_TOKENS)
  assert.strictEqual(tokenManager.tokens.length>0, true)
  var db
  var dbClient
  var results = []

  MongoClient.connect(MONGO_URL, function(err, client) {
    dbClient = client
    db = client.db(MONGO_DB_NAME)
    if(err){
      console.error("err", err);
    }else{
      console.log("Connected successfully to mongo server");
      // client.close()
      fetchRegisterUsers()
    }
  });

  async function handleUserStarRepoData(){
    // console.log("results",results)
    var buffer=""
    for(var i in results){
      var repos = results[i].starredRepo
      var uid = results[i].uid
      for(var j in repos){
        var temp = uid + "," + repos[j] + "\n"
        buffer += temp
      }
    }

    var bucketName = await new Promise(function(resolve, reject) {
      db.collection("global_config").find({"config_name":"product_vector_config"}).toArray(function(err, docs) {
        if(err) reject(err)
        else resolve(docs[0].body.bucketInfo.bucketName)
      });
    })

    s3.putObject({
      Bucket: bucketName,
      Key: OUTPUT_FILE_NAME,
      Body: buffer,
    },function (resp) {
      console.log(arguments);
      console.log('Successfully uploaded package.');
    });

    dbClient.close()
  }

  function fetchRegisterUsers(){
    db.collection(COLLECTION_NAME).find({}).toArray(function(err, docs) {
      if(err){
        console.log("find all document return error: ", err)
      }else{
        console.log(docs)
        var counter = new Counter({counter:docs.length, callback:handleUserStarRepoData})
        docs.forEach(function(doc){
          var url = API_ENDPOINT + API_SUBFIX + "?" + querystring.stringify({ access_token: tokenManager.getNextToken()})
          url = url.replace(":uid", doc._id)
          fetchUserStars(url, [], doc._id, counter)
        })

      }
    });
  }

  function fetchUserStars(url,result, uid, counter){
    var options = {
      url: url,
      headers: {
        'User-Agent': 'request'
      }
    }
    request(options, (error, response, body) => {
      var jsonBody = JSON.parse(body)
      var links
      if(response.headers.link){
        links = linkParser(response.headers.link)
      }
      for(var i in jsonBody){
        var event = jsonBody[i]
        result.push(event.id)
      }

      if(links && links.next){
        // console.log("yihahahahaa")
        fetchUserStars(links.next.url, result, uid, counter)
      }else{
        var value = {
          uid: uid,
          starredRepo: result,
        }
        results.push(value)
        counter.signal()
      }
    });
  }
})()
