
var uuid = require('uuid')
var assert = require('assert')

var Gallio = require('../Gallio.js')

describe('Gallio - basic use', function() {

  it('add and call', function(done) {
    
    var gallio = Gallio()

    var id
    
    gallio.add({role: 'foo', cmd: 'bar'}, function(args, callback) {
      id = uuid.v4()
      callback(null, id)
    })

    gallio.act({role: 'foo', cmd: 'bar'}, function(err, result) {
      assert.ok(!err, err)
      assert.equal(result, id)
      done()
    })
    
  })
  
  it('prior', function(done) {
    
    var gallio = Gallio()

    var id1
    var id2
    
    gallio.add({role: 'foo', cmd: 'bar'}, function(args, callback) {
      id1 = uuid.v4()
      callback(null, {id1: id1})
    })
    
    gallio.add({role: 'foo', cmd: 'bar'}, function(args, callback) {
      id2 = uuid.v4()
      this.prior(args, function(err, res) {
        assert.ok(!err, err)
        res.id2 = id2
        callback(null, res)
      })
    })

    gallio.act({role: 'foo', cmd: 'bar'}, function(err, result) {
      assert.ok(!err, err)
      assert.equal(result.id1, id1)
      assert.equal(result.id2, id2)
      done()
    })
    
  })

})
