
Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__caller_info', {
  get: function() {
    var callerStack = __stack
    return {
      line: callerStack[2].getLineNumber(),
      file: callerStack[2].getFileName(),
      functionName: callerStack[2].getFunctionName()
    }
  }
});
