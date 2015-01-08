module.exports.prepare_channel_rest = function(channel, dispatcher, dependencies){

	www_server = dependencies["channel.www_server"];
	channel.add_path = function(url, resource_type_name){
		www_server.route({
			method: "GET",
			path: url,
			handler: function(request, reply){
				dispatcher.resources_list_by_type(resource_type_name).then(function(resources){
					var resources_arr = resources.map(function(resource){return resource.getData()});
					reply(resources);
				});
			}
		});
		www_server.route({
			method: "POST",
			path: url,
			handler: function(request, reply){
				dispatcher.resources_create(resource_type_name).then(function(response){
					reply(response.toString());
				});
			}
		});
	}
}