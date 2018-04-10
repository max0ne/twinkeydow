const Const = require("./js/const.js")
var fs = require('fs');
var cluster = require('cluster');
const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: Const.REDIS_HOST_IP, port:Const.REDIST_HOST_PORT, ns: Const.NS} );
const metric = require("./js/metric.js")
const Puller = require("./js/puller.js")
const Worker = require("./js/worker.js")
const TokenManager = require("./js/token.js")
const MongoClient = require('mongodb').MongoClient;
const Counter = require("./js/counter.js")

const PULLER_NUM = 1
const WORKER_NUM = 2

var dbClient;

Const.api_token = process.argv[2]

if(typeof(Const.api_token)==='undefined'){
  console.error("please provide token")
  return
}

console.time("time")

function init(){
  MongoClient.connect(Const.DB_URL, function(err, client) {
    dbClient = client
    if(err){
      console.error("err", err);
    }else{
      console.log("Connected successfully to mongo server");
      var db = client.db(Const.DB_NAME);

      var tokenManager = new TokenManager(Const.api_token)
      var counter = new Counter({counter:PULLER_NUM+WORKER_NUM, callback:clean})

      for(var i=0; i<PULLER_NUM; i++){
        var puller = new Puller({tokenManager:tokenManager, counter:counter})
        puller.startPulling()
      }

      for(var i=0; i<WORKER_NUM; i++){
        var worker = new Worker({db:db, tokenManager:tokenManager, counter})
        worker.work()
      }
    }
  });
}

function clean(){
  console.log("start cleaning")
  dbClient.close()
  process.exit()
}

rsmq.listQueues( function (err, queues) {
	if( err ){
		console.error( err )
		return
	}
	else{
    if(!contain(queues, Const.QUEUE_NAME)){
      rsmq.createQueue({qname:Const.QUEUE_NAME}, function (err, resp) {
      		if (err) {
      			console.log("fail to create queue in worker:"+cluster.worker.id)
            console.log(err)
      		}else{
            init()
          }
      });
    }else{
      init()
    }
  }
});

function contain(array, value){
  for(var i in array){
    if(array[i]===value){
      return true
    }
  }
  return false
}
