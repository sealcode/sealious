var Hapi = require("hapi");

var servers = [];

module.exports = function(http_channel){
	
	http_channel.new_server = function(id, port, options){
		if(servers[id]!=undefined){
			throw new Error("server with id '"+ id + "' already exists");
		}else{
			servers[id] = new Hapi.Server(port, options);
			return servers[id]
		}
	}

	http_channel.get_server_by_id = function(id){
		if(servers[id]){
			return servers[id];
		}else{
			return null;
		}
	}
}