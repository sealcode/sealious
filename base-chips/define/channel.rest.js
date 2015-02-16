module.exports = function(channel, dispatcher, dependencies){

	//console.log("\nREST dependencies:", dependencies);

	var www_server = dependencies["channel.www_server"];

	channel.add_path = function(url, resource_type_name){

		www_server.route({
			method: "GET",
			path: url,
			handler: function(request, reply){
				dispatcher.resources_list_by_type(resource_type_name)
				.then(function(resources){ // wywołanie metody z dispatchera webowego
					//console.log("GOT RESPONSE FROM DISPATCHER");
					//var resources_arr = resources.map(function(resource){return resource.getData()});
					reply(resources);
				});
			}
			// hanlder GET ma wypisać wszystkie zasoby o podanym typie
		});

		www_server.route({
			method: "POST",
			path: url,
			handler: function(request, reply){
				var id_by_session = www_server.get_user_id(request.state.PrometheusSession);
				if(id_by_session){
					dispatcher.resources_create(resource_type_name, request.payload, id_by_session)
					.then(function(response){
						reply(response.toString());
					})
					.catch(function(error) {
						console.log("caught error:", error);
						reply(error).code(422);
					});
				} else {
					reply("not logged in");
				}
			}
			// handler POST ma stworzyć zasób z podanymi wartościami
		});

		www_server.route({
			method: "DELETE",
			path: url,
			handler: function(request, reply){
				//console.log("rest.js DELETE", request.payload)
				dispatcher.resources_delete(resource_type_name, request.payload).then(function(response){
					reply();
				});
			}
			// handler POST ma stworzyć zasób z podanymi wartościami
		});

		www_server.route({
			method: "GET",
			path: url+"/{id}",
			handler: function(request, reply){
				//console.log("rest.js get_resource_by_id", request.params.id);
				dispatcher.resources_get_by_id(request.params.id).then(function(response){
					reply(response);
				}).catch(function(error){
					reply().code(409);
				});
			}
		});

		www_server.route({
			method: "PUT",
			path: url+"/{id}/access_mode",
			handler: function(request, reply){
				//console.log("rest.js get_resource_by_id", request.params.id, request.payload.access_mode, request.payload.access_mode_args);
				dispatcher.resources_edit_resource_access_mode(request.params.id, request.payload.access_mode, request.payload.access_mode_args).then(function(response){
					reply(response);
				});
			}
		});

		www_server.route({
			method: "PUT",
			path: url+"/{id}",
			handler: function(request, reply){
				//console.log("rest.js get_resource_by_id", request.params.id, request.payload.access_mode, request.payload.access_mode_args);
				dispatcher.resources_update(request.params.id, request.payload).then(function(response){
					reply(response);
				});
			}
		});


		www_server.route({
			method: "GET",
			path: url+"/{id}/access_mode",
			handler: function(request, reply){
				//console.log("rest.js get_resource_access_mode_by_id");
				dispatcher.resources_get_access_mode(request.params.id).then(function(response){
					reply(response);
				});
			}
		});

		
	}
}