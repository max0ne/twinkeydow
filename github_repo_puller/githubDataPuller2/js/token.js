module.exports = function TokenManager(tokens, opts){
  this.counter = 0
  this.tokens = tokens.split(":")
  this.getNextToken = getNextToken
  this.popToken = popToken
}


function getNextToken(){
  var res = this.tokens[(this.counter % this.tokens.length)]
  this.counter++
  return res
}


function popToken(token){
  var index = this.tokens.indexOf(token);
  console.log("pop token: ", token)
  this.tokens.splice(index, 1);
}
