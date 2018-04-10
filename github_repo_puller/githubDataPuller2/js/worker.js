const Const = require("./const.js")
const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: Const.REDIS_HOST_IP, port:Const.REDIST_HOST_PORT, ns: Const.NS} );
const cluster = require('cluster');
const redis = require('redis');
const client = redis.createClient(); //creates a new client
const querystring = require('querystring');
const linkParser = require('parse-link-header');
const request = require('request');
const API_SUBFIX = "/user/:uid/starred"
const metric = require("./metric.js")



module.exports = function Worker(opt){
  this.id = -1
  if(opt){
    if(opt.id) this.id = opt.id
    this.db = opt.db
    this.tokenManager = opt.tokenManager
    // console.log("this.tokenManager",this.tokenManager)
  }
  console.log(`worker ${this.id} start working`);
  this.debugCounter = 0
  this.userStarApiCall = 0
  this.userNumStored = 0
  this.work = work
  this.fetchUserStars = fetchUserStars
  this.counter = opt.counter
}



function work(){
  if(this.tokenManager.tokens.length==0){
    console.log(`worker ${this.id} output metric`, {"userStarApiCall":this.userStarApiCall, "userNumStored":this.userNumStored})
    // console.log("event loop2: ",process._getActiveRequests())
    this.counter.signal()
    return
  }
  this.debugCounter++
  rsmq.popMessage({qname:Const.QUEUE_NAME}, (err, resp) => {
    if(err){
      console.log("err",err);
    }else{
      if(Object.keys(resp).length!==0){
        // console.log(`worker ${cluster.worker.id} successfully pop ${resp.message}`);
        var jsonMessage = JSON.parse(resp.message)
        var uid = jsonMessage.uid
        var url = Const.API_ENDPOINT + API_SUBFIX +"?"+querystring.stringify({ access_token: this.tokenManager.getNextToken()});
        url = url.replace(":uid", uid)
        this.fetchUserStars(url, [], uid)
      }else{
        // console.log("miss hit")
      }
    }
    this.work()
  });
}

function fetchUserStars(url,result, uid){
  var options = {
    url: url,
    headers: {
      'User-Agent': 'request'
    }
  }
  request(options, (error, response, body) => {
    this.userStarApiCall++
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
      this.fetchUserStars(links.next.url, result, uid)
    }else{
      // console.log(result)
      if(result.length >= 3){
        this.userNumStored++
        var value = {
          uid: uid,
          starredRepo: result,
        }

        this.db.collection(Const.COLLECTION_NAME).insertMany([value], (err, result) => {
          if(err){
            console.error("fail to insert into db")
          }else{
            console.log("fetching stars done for user: ", uid)
          }
        });
      }
    }
  });
}
