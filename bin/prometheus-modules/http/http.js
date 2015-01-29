module.exports.register_channels = function(){
	return ["http"]
}

module.exports.channel_info = function(channel_id){
	var ret = {};
	if(channel_id = "http"){
		ret["name"] = "Http server";
		ret["description"] = "Can serve static files or respond dynamically to a preset path. Based on the brilliant Hapi library";
	}
	return ret;
}

module.exports.channel_object = function(channel_id){
	if(channel_id="http"){
		return require("./hapi-wrapper.js");
	}
}