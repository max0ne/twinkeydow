const MongoClient = require('mongodb').MongoClient;
const dbURL = 'mongodb://localhost:27017';
const dbName = 'githubDB';
const collectionName = 'githubUserStarredRepo_v2'
const fs = require('fs');
const OUTPUT_FILE_NAME = "16kUser.csv"
var db;

MongoClient.connect(dbURL, function(err, client) {
  if(err){
    console.error("err", err);
  }else{
    console.log("Connected successfully to server");
    db = client.db(dbName);
    run()
  }
});


function run(){
  db.collection(collectionName).find({}).toArray(function(err, docs) {
    if(err){
      console.log("find all document return error: ", err)
    }else{
      console.log(docs[0])
      console.log(docs.length)
      var buffer=""
      for(var i in docs){
        var repos = docs[i].starredRepo
        var uid = docs[i].uid
        for(var j in repos){
          var temp = uid + "," + repos[j] + "\n"
          buffer += temp
        }
      }
      fs.writeFile(OUTPUT_FILE_NAME, buffer, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err;
          console.log('Lyric saved!');
      });
    }
  });

}
