module.exports = function Counter(opts){
  this.counter = opts.counter
  this.callback = opts.callback
  this.signal = signal
}

function signal(){
  if(this.counter <= 0) return
  this.counter--
  if(this.counter == 0){
    this.callback()
  }
}
