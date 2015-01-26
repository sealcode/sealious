module.exports.prepare_channel_www_server = function(channel, dispatcher, dependencies){

	www_server = dependencies["channel.www_server"];
	url = "/api/v1/chat/search";

	console.log("CHAT SEARCH SIe wykonal");


	www_server.route({
		method: "GET",
		path: url + "/{query_string}",
		handler: function(request, reply){
				dispatcher.resources_search_resource("chat_message", "message", request.params.query_string)
				.then(function(user_data){ // wywołanie metody z dispatchera webowego
					reply(user_data);
				})
			}
		// hanlder GET ma zwrócić wiadmość w obiekcie JSONowym
	});

}
