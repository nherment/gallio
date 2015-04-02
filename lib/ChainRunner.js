function ChainRunner(chain) {
  this.__chain = chain
}

ChainRunner.prototype._run = function(args, callback) {
  this.__runNext(args, callback)
}


ChainRunner.prototype.prior = function(args, callback) {
  this.__runNext(args, callback)
}

ChainRunner.prototype.__runNext = function(args, callback) {
  var next = this.__chain.next()
  if(next) {
    //if(args.trace$) {
      console.log('>>>', JSON.stringify(next.origin), JSON.stringify(args))
    //}
    next.func.call(this, args, function(err, result) {
      if(callback) {
        callback(err, result)
      }
    })
  } else if(callback) {
    callback(undefined, undefined)
  }
}


module.exports = ChainRunner
