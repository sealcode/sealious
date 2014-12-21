module.exports.register_channels = function(){
	return ["http"]
}

module.exports.prepare_channel_http = function(channel){
	channel.hapi = require("./hapi-wrapper.js");
}