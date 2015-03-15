module.exports = function(www_server, dispatcher, dependencies){
	var sessionManager = dependencies["service.session_manager"];


	url = "/api/v1/users";

	www_server.route({
		method: "GET",
		path: url,
		handler: function(request, reply){
			if(1){
				console.log(dispatcher.services.user_manager);
				dispatcher.services.user_manager.get_all_users()
				.then(function(users){ // wywołanie metody z dispatchera webowego
					reply(users);
				})
			}else{
				reply("No data received.")
			}
	}
		// hanlder GET ma zwrócić dane użytkowników w obiekcie JSONowym
	});

	www_server.route({
		method: "GET",
		path: url + "/{user_id}",
		handler: function(request, reply){
				dispatcher.services.user_manager.get_user_data(request.params.user_id)
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
			//console.log("user/channel.www_server.js", "username and password:", request.payload.username, ":", request.payload.password);
			dispatcher.services.user_manager.create_user(request.payload.username, request.payload.password)
				.then(function(response){
					reply().redirect("/login.html#registered");
				})
				.catch(function(error){
					reply(error);
				})
		}
		// handler POST ma stworzyć usera o podanej nazwie i haśle
	});

	www_server.route({
		method: "PUT",
		path: url+"/{user_id}",
		handler: function(request, reply){
			dispatcher.services.user_manager.update_user_data(request.params.user_id, request.payload)
				.then(function(response){
					reply();
				})
		}

	});


	www_server.route({
		method: "DELETE",
		path: url,
		handler: function(request, reply){
			dispatcher.services.user_manager.delete_user(request.payload.username)
				.then(function(user_data){
					reply(user_data);
				})
				.catch(function(error){
					reply(error);
				})
			}
	});

	www_server.route({
		method: "GET",
		path: url+"/me",
		handler: function(request, reply){
			var session_id = request.state.PrometheusSession;
			var user_id = www_server.get_user_id(session_id);
			dispatcher.services.user_manager.get_user_data(user_id)
			.then(function(user_data){
				if(user_data){
					user_data.user_id = user_id;
					reply(user_data);					
				}else{
					reply("not logged in");
				}
			})
			.catch(function(err){
				reply(err);
			})
		}
		// hanlder GET ma zwrócić dane użytkownika w obiekcie JSONowym
	});

	www_server.route({
		method: "PUT",
		path: url+"/me",
		handler: function(request, reply){
			var session_id = request.state.PrometheusSession;
			var user_id = www_server.get_user_id(session_id);
			dispatcher.services.user_manager.update_user_data(user_id, request.payload)
			.then(function(){
				reply("ok!");
			})
		}	
	})

	www_server.route({
        method: "POST",
        path: "/login",
        handler: function(request, reply) {
            dispatcher.services.user_manager.password_match(request.payload.username, request.payload.password)
            .then(function(user_id) {
                if (user_id!==false) {
                    var sessionId = www_server.new_session(user_id);
                    reply("http_session: Logged in!").state('PrometheusSession', sessionId);
                }
            })
            .catch(function(error){
            	reply(error);
            })
        }
    });

    www_server.route({
        method: "POST",
        path: "/logout",
        handler: function(request, reply) {
            www_server.kill_session(request.state.PrometheusSession);
            reply().redirect("/login.html");
        }
    });

    www_server.route({
        method: "GET",
        path: "/api/v1/make_coffee",
        handler: function(request, reply) {
            reply().code(418);
        }
    });

}