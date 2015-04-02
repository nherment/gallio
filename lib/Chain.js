/**
 * The chain of logic that should handle a specific pattern.
 */

function Chain() {
  this.__head = null
  this.__tail = null
}

Chain.prototype._prepend = function(data) {
  this.__head = {
    next: this.__head,
    data: data
  }
  if(!this.__tail) {
    this.__tail = this.__head
  }
}

Chain.prototype._append = function(data) {

  var appended = {
    next: null,
    data: data
  }
  
  if(this.__tail) {
    this.__tail.next = appended
  }
  
  this.__tail = appended
  
  if(!this.__head) {
    this.__head = this.__tail
  }
}

Chain.prototype.next = function() {
  if(!this.__current) {
    this.__current = this.__head
  }
  var current = this.__current
  if(current) {
    this.__current = current.next || {} // so that we don't start from the head when we reach the end
    return current.data
  }
  return undefined
}


module.exports = Chain

