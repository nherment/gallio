
var assert = require('assert')
var uuid = require('uuid')

var Router = require('../lib/Router.js')

describe('Router', function() {

  it('route 1 single endpoint', function() {
    var r = new Router()

    var expectedId = uuid.v4()
    
    r.register({'1': '1'}, expectedId)

    var chain = r.fetchChain({'1': '1'})

    assert.equal(chain.next(), expectedId)
  })

  it('route 2 identical endpoints', function() {
    var r = new Router()

    var expectedId1 = uuid.v4()
    var expectedId2 = uuid.v4()
    
    r.register({'1': '1'}, expectedId1)
    r.register({'1': '1'}, expectedId2)

    var chain = r.fetchChain({'1': '1'})

    assert.equal(chain.next(), expectedId2)
    assert.equal(chain.next(), expectedId1)
  })

  it('route 2 different endpoints', function() {
    var r = new Router()

    var expectedId1 = uuid.v4()
    var expectedId2 = uuid.v4()
    
    r.register({'1': '1'}, expectedId1)
    r.register({'1': '2'}, expectedId2)

    var chain1 = r.fetchChain({'1': '1'})
    assert.equal(chain1.next(), expectedId1)
    assert.ok(!chain1.next())

    var chain2 = r.fetchChain({'1': '2'})
    assert.equal(chain2.next(), expectedId2)
    assert.ok(!chain2.next())
  })

  it('route 2 levels', function() {
    var r = new Router()

    var expectedId1 = uuid.v4()
    var expectedId2 = uuid.v4()
    
    r.register({'1': '1'}, expectedId2)
    r.register({'1': '1', '2': '2'}, expectedId1)

    var chain = r.fetchChain({'1': '1', '2': '2'})
    assert.equal(chain.next(), expectedId1)
    assert.equal(chain.next(), expectedId2)
  })
  
})
