const Const = require("./const.js")
const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: Const.REDIS_HOST_IP, port:Const.REDIST_HOST_PORT, ns: Const.NS} );
const Timer = require('setinterval');
const cluster = require('cluster');
const request = require('request');
const querystring = require('querystring');
const linkParser = require('parse-link-header');
const API_SUBFIX = "/events"

module.exports = function Puller(opt){
  // this.tokenManager = new TokenManager(Const.api_token)
  this.tokenManager = null
  this.startPulling = startPulling
  this._runNewTimer = _runNewTimer
  this._run = _run
  this.t = null
  this._deleteOldTimer = _deleteOldTimer
  this.id = -1
  this.debugCounter = 0
  this.lastRequestModifiedTime = ""
  this.interval = 3000
  this.eventApiCall = 0
  this.userNumFetched = 0
  if(opt){
    if(opt.id){
      this.id = opt.id
    }
    this.tokenManager = opt.tokenManager
  }
  this.counter = opt.counter
}


function _run(){
  if(this.tokenManager.tokens.length===0){
    console.log("All tokens used, process exit")
    console.log(`puller ${this.id} output metric`, {"eventApiCall":this.eventApiCall, "userNumFetched":this.userNumFetched})
    this._deleteOldTimer()
    // console.log("event loop1: ",process._getActiveRequests())
    // console.log("handler loop: ",process._getActiveHandles())
    this.counter.signal()
    return
  }

  this.debugCounter++
  var curToken = this.tokenManager.getNextToken()
  var url = Const.API_ENDPOINT + API_SUBFIX +"?"+querystring.stringify({ access_token: curToken});
  var options = {
    url: url,
    headers: {
      'User-Agent': 'request'
    }
  }
  request(options, (error, response, body) => {
    this.eventApiCall++
    var jsonBody = JSON.parse(body)
    var currentRequestModifiedTime = response.headers["last-modified"]
    if(this.lastRequestModifiedTime !== currentRequestModifiedTime){
        for(var i in jsonBody){
          var event = jsonBody[i]
          if(!event.actor){
            console.log("event:",event)
            console.log("jsonBody",jsonBody)
          }
          if(event==="https://developer.github.com/v3/#abuse-rate-limits"){
            console.log("slowing down")
            this.interval += 2000
            this._deleteOldTimer()
            this._runNewTimer()
            break
          }else if(/API rate limit exceeded/.test(event)) {
            this.tokenManager.popToken(curToken)
            break
          }else{
            // console.log("event.actor:", event.actor)
            var uid = event.actor.id
            var msg = {uid: uid}
            msg = JSON.stringify(msg)
            rsmq.sendMessage({qname:Const.QUEUE_NAME, message:msg}, function (err, resp) {
              if(err){
                console.log("err",err)
              }else{
                console.log(`puller ${this.id} successfully push ${resp}`)
                this.userNumFetched++
              }
            });
          }
        }

        this.interval -= 100
        this._deleteOldTimer()
        this._runNewTimer()

    }

    this.lastRequestModifiedTime = currentRequestModifiedTime
  });
}


function _runNewTimer(){
  console.log(this.interval)
  var caller = this
  this.t = new Timer(function*() {
    caller._run()
  }, this.interval);
  this.t.setInterval()
}

function _deleteOldTimer(){
  if(this.t){
    this.t.clearInterval();
  }
}

function startPulling() {
  this._runNewTimer()
}
