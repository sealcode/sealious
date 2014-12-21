
module.exports.prepare_service_database_view = function(db_view_service, dependencies){
	db_view_service.on("list_type", function(payload, callback) {
		resourceManager.getResourceByType("chat-message", {skip: 10, amount: 2, sort: {prometheus_id: 1}}, callback);
	})
	db_view_service.on("list", function(payload, callback){
		console.log("inside the proper service ON LIST event handler");
		resourceManager.getResourceByID("5477108203814fc515f86858", callback)
		
	})
	db_view_service.on("create", function(payload, callback){
		resourceManager.newResource("chat-message", {name: "testowy", kupa: "dupa"}, function(response){
			callback(response);
		})
	})
	db_view_service.on("first_free_id", function(payload, callback){
		resourceManager.getFirstFreeID(callback);
	})
}

module.exports.postprocess_channel_www_server = function(www_server, dependencies){

	console.log(dependencies);

	var db_view_service = dependencies["service.database_view"];
	
	www_server.route(
	{
		method: 'GET',
		path: '/lolo',
		handler: function(request, reply){
			console.log("captured request for nono");
			db_view_service.emit("list", function(data){
				reply(data);
			})
		}
	});

	www_server.route(
	{
		method: 'GET',
		path: '/list_type',
		handler: function(request, reply){
			console.log("list_type");
			db_view_service.emit("list_type", function(data){
				reply("<pre>" + JSON.stringify(data, null, "\t"));
			})
		}
	});
	
	www_server.route(
	{
		method: 'GET',
		path: '/lolo2',
		handler: function(request, reply){
			console.log("captured request for nono");
				console.log("lolo2");
			db_view_service.emit("create", function(data){
				reply(data);
			})
		}
	});

	www_server.route(
	{
		method: 'GET',
		path: '/first_free_id',
		handler: function(request, reply){
			console.log("captured request for nono");
			db_view_service.emit("first_free_id",  function(data){
				reply(data);
			})
		}
	});


}