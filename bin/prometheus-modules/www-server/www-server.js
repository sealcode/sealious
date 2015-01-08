var ExceptionHandler = require("prometheus-exception-handler");

ExceptionHandler.addErrorParser(function(err){
	if(err.code=="EACCES"){
		return "cannot listen on port 80 without root";
	}
	if (err.code=="EADDRINUSE") {
		return "Port 80 is already taken";
	}
})


module.exports.prepare_channel_www_server = function(channel, dispatcher, dependencies){
	var http_channel = dependencies["channel.http"];

	channel.server = http_channel.hapi.new_server("www", 80, {cors:true});
	
	channel.start = function(){
		this.server.start(function(err){
			console.log("www server started at port 80");
			console.log('HTTP: '+channel.server.info.uri+'\n================ \n');
		})
	}

	channel.route = function(){
		this.server.route.apply(this.server, arguments);
	}
}
