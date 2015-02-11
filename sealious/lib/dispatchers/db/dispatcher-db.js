var server = require("./database-rest-server.js");
server.start(function(){
	console.log("DB server started");
});

var DispatcherDistributedDB = new function(){
}

module.exports = DispatcherDistributedDB;