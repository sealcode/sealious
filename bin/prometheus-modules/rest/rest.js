module.exports.prepare_channel_rest = function(channel, dispatcher, dependencies){

	www_server = dependencies["channel.www_server"];
	channel.add_path = function(url, resource_type_name){
		www_server.route({
			method: "GET",
			path: url,
			handler: function(request, reply){
				dispatcher.resources_list_by_type(resource_type_name).then(function(resources){ // wywołanie metody z dispatchera webowego
					var resources_arr = resources.map(function(resource){return resource.getData()});
					reply(resources_arr);
				});
			}
			// hanlder GET ma wypisać wszystkie zasoby o podanym typie
		});
		www_server.route({
			method: "POST",
			path: url,
			handler: function(request, reply){
				console.log("rest.js POST", request.payload)
				dispatcher.resources_create(resource_type_name, request.payload).then(function(response){
					reply(response.toString());
				});
			}
			// handler POST ma stworzyć zasób z podanymi wartościami
		});

		www_server.route({
			method: "DELETE",
			path: url,
			handler: function(request, reply){
				console.log("rest.js DELETE", request.payload)
				dispatcher.resources_delete(resource_type_name, request.payload).then(function(response){
					reply();
				});
			}
			// handler POST ma stworzyć zasób z podanymi wartościami
		});
	}
}