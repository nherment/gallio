
var _ = require('lodash')
var request = require('request')

function Client(options, gallio) {
  this._host = options.host
  this._port = options.port
  var self = this
  if(options.pins) {
    _.each(options.pins, function(pattern) {
      self._addPattern(gallio, pattern)
    })
  } else if(options.pin) {
    self._addPattern(gallio, options.pin)
  } else {
    gallio._catchAll(function(args, callback) {
      actRPC(self._host, self._port, args, callback)
    })
  }
}

Client.prototype._addPattern = function(gallio, pattern) {
  for(var field in pattern) {
    if(pattern[field] === '*') {
      delete pattern[field]
    }
  }
  var self = this
  gallio.add(pattern, function(args, callback) {
    actRPC(self._host, self._port, args, callback)
  })
}

function actRPC(host, port, args, callback) {
  var url = 'http://'+host+':'+port
  request.post(url, {args: args}, function (err, response, body) {
    if (err) {
      if(err.code === 'ECONNREFUSED') {
        err = new Error('Connection to [' + url + '] refused. Check that the remote service is running.')
        throw err
      } else {
        // die in flames and smoke
        throw err
      }
    } else if(response.statusCode === 200) {
      if(body.error) {
        err = new Error(body.error.message)
        callback(err, undefined)
      } else {
        callback(undefined, body.result)
      }
    } else {
      err = new Error(JSON.stringify(body))
      callback(err, undefined)
    }
  })
}

module.exports = Client
