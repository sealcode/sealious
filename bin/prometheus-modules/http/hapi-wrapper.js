var Hapi = require("hapi");

var servers = [];

//var server = new Hapi.Server(3001, {cors:true});

module.exports.new_server = function(id, port, options){
	if(servers[id]!=undefined){
		throw new Error("server with id '"+ id + "' already exists");
	}else{
		servers[id] = new Hapi.Server(port, options);
		return servers[id]
	}
}

module.exports.get_server_by_id = function(id){
	if(servers[id]){
		return servers[id];
	}else{
		return null;
	}
}