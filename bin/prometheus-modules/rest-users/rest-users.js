module.exports.prepare_channel_www_server = function(channel, dispatcher, dependencies){

	www_server = dependencies["channel.www_server"];
	url = "/api/v1/user";
	www_server.route({
		method: "GET",
		path: url,
		handler: function(request, reply){
			dispatcher.users_get_user_data(request.payload.username, dispatcher).then(function(userdata){ // wywołanie metody z dispatchera webowego
				reply(userdata);
			});
		}
		// hanlder GET ma zwrócić dane użytkownika w obiekcie JSONowym
	});
	www_server.route({
		method: "POST",
		path: url,
		handler: function(request, reply){
			console.log("rest.js POST", request.payload)
			dispatcher.users_user_create(request.payload.username, request.payload.password, dispatcher).then(function(response){
				reply(response.userdata_id.toString());
			});
		}
		// handler POST ma stworzyć usera o podanej nazwie i haśle
	});
/*
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
*/
}