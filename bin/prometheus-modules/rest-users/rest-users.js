module.exports.prepare_channel_www_server = function(channel, dispatcher, dependencies){

	www_server = dependencies["channel.www_server"];
	url = "/api/v1/user";
	www_server.route({
		method: "GET",
		path: url,
		handler: function(request, reply){
			if(1){
				dispatcher.users_get_all_users()
					.then(function(users){ // wywołanie metody z dispatchera webowego
						reply(users);
					})
			}else{
				reply("No data received.")
			}
	}
		// hanlder GET ma zwrócić dane użytkownika w obiekcie JSONowym
	});

	www_server.route({
		method: "GET",
		path: url + "/{user_id}",
		handler: function(request, reply){
				dispatcher.users_get_user_data(request.params.user_id)
					.then(function(user_data){ // wywołanie metody z dispatchera webowego
						reply(user_data);
					})
					.catch(function(error){
						reply("There is no such user. Go away.");
					})

			}
		// hanlder GET ma zwrócić dane konkretnego użytkownika w obiekcie JSONowym
	});


	www_server.route({
		method: "POST",
		path: url,
		handler: function(request, reply){
			dispatcher.users_create_user(request.payload.username, request.payload.password)
				.then(function(response){
					reply(response[0].userdata_id.toString());
				})
				.catch(function(error){
					reply("Username is taken.").statusCode="409.1";
				})
		}
		// handler POST ma stworzyć usera o podanej nazwie i haśle
	});

	www_server.route({
		method: "PUT",
		path: url+"/{user_id}",
		handler: function(request, reply){
			console.log("rest-user.js", "request.payload", request.payload);
			dispatcher.users_update_user_data(request.params.user_id, request.payload)
				.then(function(response){
					reply();
				})
		}

	});


		www_server.route({
			method: "DELETE",
			path: url,
			handler: function(request, reply){
				//console.log("rest.js DELETE", request.payload)
				dispatcher.users_delete_user(request.payload.username)
					.then(function(user_data){
						reply(user_data);
					})
					.catch(function(error){
						reply(error);
					})
				}
		});

}