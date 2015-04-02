/**
 * Allows to register patterns as input and output a chain of callbacks to be executed
 */
var patrun = require('patrun')
var _ = require('lodash')
var Chain = require('./Chain.js')

function Router() {
  this._patrun = patrun()
}

Router.prototype.register = function(pattern, handler) {
  var exact = this._patrun.findexact(pattern)

  if(exact) {
    exact.prepend(handler)
  } else {
    var routeElement = new RouteElement()

    routeElement.prepend(handler)

    var parent = this._patrun.find(pattern)
    if(parent && exact !== parent) {
      routeElement.append(parent)
    }
    this._patrun.add(pattern, routeElement)
  }

}

Router.prototype.list = function(pattern) {
  return this._patrun.list(pattern)
}

Router.prototype.fetchChain = function(pattern) {
  var chainData = this._patrun.find(pattern)
  if(chainData && chainData.list().length > 0) {
    var chain = new Chain()
    recursiveIterator(chainData, function(item) {
      chain._append(item)
    })

    return chain
  } else {
    return null
  }
}

function recursiveIterator(chainData, func) {
  if(chainData && chainData instanceof RouteElement) {
    _.each(chainData.list(), function(item) {
      if(item instanceof RouteElement) {
        recursiveIterator(item, func)
      } else {
        func(item)
      }
    })
  }
}

function RouteElement() {
  this.__list = []
}

RouteElement.prototype.append = function(data) {
  this.__list.push(data)
}

RouteElement.prototype.prepend = function(data) {
  this.__list.unshift(data)
}

RouteElement.prototype.list = function() {
  return this.__list
}

module.exports = Router
