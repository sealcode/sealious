var Dispatcher = require("../dispatcher.js");
var db_biz_protocol = require("./database-rest-server.js");

db_biz_protocol.server.start(function(){
	console.log("DB server started");
});

var DispatcherDistributedDB = Object.create(new Dispatcher());

module.exports = DispatcherDistributedDB;