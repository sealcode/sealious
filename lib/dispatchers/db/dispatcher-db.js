var Dispatcher = require("../dispatcher.js");
var db_biz_protocol = require("./database-rest-server.js");

var DispatcherDistributedDB = Object.create(new Dispatcher());


DispatcherDistributedDB.init = function(){
	db_biz_protocol.server.start(function(){
		console.log("DB server started");
	});
}

module.exports = DispatcherDistributedDB;