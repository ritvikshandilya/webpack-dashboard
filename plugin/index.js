/* eslint-disable */
"use strict";

var webpack = require("webpack");
var net = require("net");
var JsonSocket = require("json-socket");

function noop() {}

function DashboardPlugin(options) {
  if (typeof options === "function") {
    this.handler = options;
  } else {
    options = options || {};
    this.port = options.port || 9838;
    this.handler = options.handler || null;
  }
}

DashboardPlugin.prototype.apply = function(compiler) {
  var handler = this.handler;

  if (!handler) {
    handler = noop;
    var port = this.port;
    var host = '127.0.0.1';
    var socket = new JsonSocket(new net.Socket());
    socket.connect(port, host);
    socket.on('connect', function() {
      handler = socket.sendMessage.bind(socket);
    });
  }

  compiler.apply(new webpack.ProgressPlugin(function (percent, msg) {
    handler.call(null, [{
      type: "status",
      value: "Compiling"
    }, {
      type: "progress",
      value: percent
    }, {
      type: "operations",
      value: msg
    }]);
  }));

  compiler.plugin("compile", function() {
    handler.call(null, [{
      type: "status",
      value: "Compiling"
    }]);
  });

  compiler.plugin("invalid", function() {
    handler.call(null, [{
      type: "status",
      value: "Invalidated"
    }, {
      type: "progress",
      value: 0
    }, {
      type: "operations",
      value: "idle"
    }, {
      type: "clear"
    }]);
  });

  compiler.plugin("done", function(stats) {
    handler.call(null, [{
      type: "status",
      value: "Success"
    }, {
      type: "stats",
      value: {
        errors: stats.hasErrors(),
        warnings: stats.hasWarnings(),
        data: stats.toJson()
      }
    }, {
      type: "progress",
      value: 0
    }, {
      type: "operations",
      value: "idle"
    }]);
  });

  compiler.plugin("failed", function() {
    handler.call(null, [{
      type: "status",
      value: "Failed"
    }, {
      type: "operations",
      value: "idle"
    }]);
  });

}

module.exports = DashboardPlugin;
