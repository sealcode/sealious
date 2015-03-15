var Promise = require("bluebird");
var path = require("path");

module.exports = function(www_server, dispatcher, dependencies){

	var public_dir = path.resolve(module.filename, "../../../../public");
	www_server.static_route(public_dir, "");

	www_server.route({
		method: "GET", 
		path: "/api/v1/chat/conversation/{id}/messages",
		handler: function(request, reply){
			dispatcher.resources.find({conversation_id: parseInt(request.params.id)}, "chat_message")
				.then(function(resources){
					reply(resources);
				})
		}
	});

	www_server.route({
		method: "GET",
		path: "/api/v1/chat/conversation/mine",
		handler: function(request, reply){
			var me = www_server.get_user_id(request.state.PrometheusSession);
			me = me.toString();
			console.log(me);
			var p1 = dispatcher.resources.find({user2: me}, "chat_conversation");
			var p2 = dispatcher.resources.find({user1: me}, "chat_conversation");
			var p3 = dispatcher.resources.search_by_mode("chat_conversation", "public");
			Promise.all([p1,p2,p3]).then(function(response){
				console.log(response);
				reply(response);
			})
		}
	});


	www_server.route({
		method: "GET",
		path: "/api/v1/chat/search/{query_string}",
		handler: function(request, reply){
				dispatcher.resources.search("chat_message", "message", request.params.query_string)
				.then(function(data){
					reply(data);
				})
			}
	});
}