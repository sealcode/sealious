var Core = require("prometheus-core");

module.exports.register_channels = function(){
	return ["www-server"];
}

module.exports.channel_info = function(channel_id){
	var ret = {};
	if(channel_id=="www-server"){
		ret["name"] = "WWW Server";
		ret["description"] = "A simple HTTP server on port 80";
		ret["single_instance"] = true;
	}
	return ret;
}

module.exports.channel_object = function(channel_id){
	if(channel_id=="www-server"){
		var http_channel = Core.getChannel("http");
		var server = http_channel.new_server("www", 80, {cors:true});
		server.start(function(){
			console.log("www server started at port 80");
			console.log('HTTP: '+server.info.uri+'\n================ \n');
		})
		return server;
	}
}