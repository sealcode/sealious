var Hapi = require("hapi");

var servers = [];

module.exports = function(http_channel){
	
	http_channel.new_server = function(options){
		return new Hapi.Server(options);
	}

	http_channel.get_server_by_id = function(id){
		if(servers[id]){
			return servers[id];
		}else{
			return null;
		}
	}
}