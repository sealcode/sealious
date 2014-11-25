var Service = require("prometheus-service");
var Database_access = require("prometheus-database-accessor");
var resourceManager = require("prometheus-resource-manager");

module.exports.register_services = function(){
	return ["database-view"];
}

module.exports.service_info = function(service_name){
	var ret = {};
	if(service_name=="database-view"){
		ret["name"] = "Database-view";
		ret["description"] = "A simple example service that displays documents stored in the database";
	}
	return ret;
}


function construct_service(){
	var db_view_service =  new Service();
	db_view_service.on("list", function(payload, callback){
		console.log("inside the proper service ON LIST event handler");
		Database_access.query("resources", "find", {}, {}).then(function(response){
			callback(response);
		})
	})
	db_view_service.on("create", function(payload, callback){
		resourceManager.newResource("test", {name: "testowy", kupa: "dupa"}, function(response){
			callback(response);
		})
	})
	return db_view_service;
}

module.exports.service_object = function(service_name, dependencies){
	if(service_name=="database-view"){
		var ret = construct_service();
		//setup_channel(dependencies, ret);
	}
	return ret;
}

module.exports.channel_setup = function(channel_id, dependencies){
	//console.log("got dependencies:", dependencies);
	var www_server = dependencies["channel.www-server"];
	var db_view_service = dependencies["service.database-view"];

	
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
		path: '/lolo2',
		handler: function(request, reply){
			console.log("captured request for nono");
			db_view_service.emit("create", function(data){
				reply(data);
			})
		}
	});

}