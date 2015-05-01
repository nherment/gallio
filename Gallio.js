
var serial = require('serial')
var _ = require('lodash')
var Router = require('./lib/Router.js')
var ChainRunner = require('./lib/ChainRunner.js')
var Server = require('./lib/Server.js')
var Client = require('./lib/Client.js')

require('./lib/GlobalHacks.js')

function Gallio() {
  this._router = new Router()
  this._plugins = []
  this._status = 'new'
  this._options = {}
  this._fixedArgs = {}
  this._servers = []
  this._exports = {}
  this.__catchAll = null
}

var delegateProxies = [
  '_router',
  '_plugins',
  '_options',
  '_exports',
  '__catchAll'
]

Gallio.prototype.prepareInitialization = function() {
  
  if(this._status === 'new') {
    this._status = 'init_pending'
    var self = this
    setImmediate(function() {
      self.initialize()
    })
  }
  
  if(this._status !== 'init_pending') {
    throw new Error('Initialization already started. Too late for this action. All gallio.use() and gallio.listen() call must be synchronous and done when gallio is instantiated.')
  }
  
}

Gallio.prototype.initialize = function() {
  
  if(this._status === 'init_pending') {
    var self = this
    this._status = 'initializing'
    
    var runner = new serial.SerialRunner()
    
    _.each(this._plugins, function(pluginName) {
      runner.add(initPlugin, self, pluginName)
    })

    runner.onError(function(err) {
      throw err
    })
    
    runner.run(function() {
      this._status = 'initialized'
    })
  } else {
    throw new Error('Gallio instance already initialized')
  }
  
}

Gallio.prototype.use = function(plugin, options) {
  var pluginName = null

  if(plugin === 'options') {
    this._options = options
    return;
  }

  if(typeof plugin === 'string') {
    pluginName = plugin
    try {
      plugin = require('seneca-' + pluginName)
    } catch(err) {
      if(/Cannot find module/.test(err.message) && module.parent) {
        plugin = module.parent.require('seneca-' + pluginName)
      } else {
        throw err
      }
    }
  }

  if(typeof plugin !== 'function') {
    throw new Error('Plugin should be a function')
  }

  if(pluginName) {
    var pluginOptions = this._options[pluginName]
  }
  
  var pluginInfo = plugin.call(this, options || pluginOptions || {})
  if(pluginInfo && pluginInfo.name) {
    pluginName = pluginInfo.name
  }
  if(pluginInfo && pluginInfo.export) {
    this._exports[pluginInfo.name] = pluginInfo.export
  }
  if(pluginName) {
    this._plugins.push(pluginName)
  }
  this.prepareInitialization()
}

Gallio.prototype.delegate = function(fixedArgs) {
  var self = this
  var delegate = new Gallio()
  delegate._fixedArgs = _.extend(_.clone(this._fixedArgs), fixedArgs || {})
  _.each(delegateProxies, function(proxy) {
    delegate[proxy] = self[proxy]
  })
  return delegate
}

Gallio.prototype.add = function(pattern, func) {
  this._router.register(normalizedPattern, {
    origin: __caller_info,
    func: func
  })
}

Gallio.prototype.act = function(args, callback) {
  var self = this
  var chain = this._router.fetchChain(args)
  if(chain) {
    var runner = new ChainRunner(chain)
    // hack #1
    runner.act = function(args, callback) {
      self.act(args, callback)
    }
    // hack #2
    runner.make = runner.make$ = function(entityDef) {
      return self.make(entityDef)
    }
    args = _.clone(args)
    args = _.extend(args, this._fixedArgs)
    runner._run(args, callback)
  } else if(this._catchAll()) {
    console.log('WARN - catchAll', JSON.stringify(args))
    this._catchAll().call(this, args, callback)
  } else {
    throw new Error('No act registered for args' + JSON.stringify(args))
  }
}

Gallio.prototype.listen = function(options) {
  var server = new Server(options.host, options.port, this)
  this._servers.push(server)
  server.start()
}

Gallio.prototype.status = function() {
  return this._status()
}

Gallio.prototype.client = function(options) {
  // it's ugly and events should be used instead
  new Client(options, this)
}

Gallio.prototype._catchAll = function(func) {
  if(func) {
    this.__catchAll = func
  } else {
    return this.__catchAll
  }
}

Gallio.prototype.log = {
  info: console.info,
  warn: console.warn,
  error: console.error
}

Gallio.prototype.util = {
  deepextend: _.merge,
  parsecanon: parseEntityType
  
}

Gallio.prototype.options = function() {
  return this._options
}

Gallio.prototype.make = Gallio.prototype.make$ = function(entityTypeStr) {
  var entityType = parseEntityType(entityTypeStr)
  var self = this
  return {
    save$: function(obj, callback) {
      obj.entity$ = entityTypeStr
      var pattern = {
        role: 'entity',
        cmd: 'save',
        ent: obj
      }
      _.merge(pattern, entityType)
      self.act(pattern, callback)
    },
    load$: function(obj, callback) {
      obj.entity$ = entityTypeStr
      var pattern = {
        role: 'entity',
        cmd: 'load',
        ent: obj
      }
      _.merge(pattern, entityType)
      self.act(pattern, callback)
    },
    list$: function(obj, callback) {
      obj.entity$ = entityTypeStr
      var pattern = {
        role: 'entity',
        cmd: 'list',
        ent: obj
      }
      _.merge(pattern, entityType)
      self.act(pattern, callback)
    },
    remove$: function(obj, callback) {
      obj.entity$ = entityTypeStr
      var pattern = {
        role: 'entity',
        cmd: 'remove',
        ent: obj
      }
      _.merge(pattern, entityType)
      self.act(pattern, callback)
    },
    canon$: function(opts) {
      if(opts.string) {
        return stringifyEntityType(entityType)
      } else if(opts.array) {
        return stringifyEntityType(entityType).split('/')
      } else {
        throw new Error('unsupported canon$ call with opts' + JSON.stringify(opts))
      }
    },
    make$: function() {
      return this
    }
  }
}

Gallio.prototype.act_if = function() {
 //noop
}

Gallio.prototype.depends = function() {
 //noop
}

Gallio.prototype.pin = function(pattern) {

  var self = this
  
  var methods = this._router.list(pattern)
  
  var methodkeys = []
  for( var key in pattern ) {
    if( /[\*\?]/.exec(pattern[key]) ) {
      methodkeys.push(key)
    }
  }

  var api = {}

  methods.forEach(function(method) {
    var mpat = method.match

    var methodname = ''
    
    for(var mkI = 0; mkI < methodkeys.length; mkI++) {
      methodname += (( 0 < mkI ? '_' : '' )) + mpat[methodkeys[mkI]]
    }

    api[methodname] = function(args, callback) {
      var fullargs = _.extend({}, args, mpat)
      self.act(fullargs, callback)
    }
  })

  return api

}

Gallio.prototype.export = function(moduleName) {
  if(this._exports[moduleName]) {
    return this._exports[moduleName]
  } else {
    throw new Error('Could not find export ' + moduleName)
  }
}

function initPlugin(gallio, pluginName, cb) {
  gallio.act({init: pluginName}, function(err) {
    if(err) {
      throw err
    } else {
      cb()
    }
  })
}

function parseEntityType(entityTypeStr) {
  if(_.isString(entityTypeStr)) {
    var data = entityTypeStr.split('/')
    if(data.length === 1) {
      return {
        name: data[0]
      }
    } else if(data.length === 2) {
      return {
        base: data[0],
        name: data[1]
      }
    } else if(data.length === 3) {
      return {
        zone: data[0],
        base: data[1],
        name: data[2]
      }
    }
  } else if(entityTypeStr.hasOwnProperty('zone') ||
            entityTypeStr.hasOwnProperty('base') ||
            entityTypeStr.hasOwnProperty('name')) {
    return entityTypeStr
  }
}

function stringifyEntityType(entityType) {
  var str = ''
  if(entityType.zone) {
    str += entityType.zone + '/'
  }
  if(entityType.base) {
    str += entityType.base + '/'
  }
  if(entityType.name) {
    str += entityType.name
  }
  return str
}


module.exports = function() {
  return new Gallio()
}
