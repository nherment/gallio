

var assert = require('assert')

var Chain = require('../lib/Chain.js')

describe('Chain', function() {

  it('append', function() {
    var c = new Chain()

    c._append(0)
    c._append(1)
    c._append(2)
    c._append(3)
    c._append(4)

    var cnt = 0;
    do {
      var item = c.next()
      assert.equal(item, cnt)
      cnt ++
    } while(item)

    
  })

  it('prepend', function() {
    var c = new Chain()

    c._prepend(4)
    c._prepend(3)
    c._prepend(2)
    c._prepend(1)
    c._prepend(0)

    var cnt = 0;
    do {
      var item = c.next()
      assert.equal(item, cnt)
      cnt ++
    } while(item)

    
  })

  it('prepend & append mixed', function() {
    var c = new Chain()

    c._prepend(2)
    c._append(3)
    c._prepend(1)
    c._append(4)
    c._prepend(0)

    var cnt = 0;
    do {
      var item = c.next()
      assert.equal(item, cnt)
      cnt ++
    } while(item)

    
  })
  
})
