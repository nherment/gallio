var express = require('express')
var bodyParser = require('body-parser')

var EventEmitter = require('events').EventEmitter
var util = require('util')

// TODO: actually use the events
function Server(bindAddress, port, gallio) {
  EventEmitter.call(this)

  var self = this
  this._gallio = gallio
  this._bindAddress = bindAddress
  this._port = port
  this._app = express()
  this._app.use(bodyParser.json({
    strict: true // only accept arrays and objects
  }))

  this._app.use(function(req, res) {
    self._processAct(req, res)
  })
}

util.inherits(Server, EventEmitter)

Server.prototype.start = function(callback) {
  var self = this
  this._server = this._app.listen(this._port, this._bindAddress, function () {

    var host = self._server.address().address
    var port = self._server.address().port

    console.log('Listening on', host + ':' + port)
    
    if(callback) {
      callback(self._server.address())
    }
  })
}

Server.prototype._processAct = function(req, res) {

  if(req.body) {
    var wrapper = req.body
    
    this._gallio.act(wrapper.args, function(err, result) {
      // TODO: JSONify the error
      res.send({error: err, result: result})
    })
    
  } else {
    res.status(400).send('body should not be empty')
  }
  
}



module.exports = Server
