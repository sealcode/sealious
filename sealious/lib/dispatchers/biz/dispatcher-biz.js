var io = require('socket.io')();
var http = require("request");
var QueryString = require("query-string");
var Promise = require("bluebird");

var config 			= require("../../config/config-manager.js").getConfiguration();
var MetadataManager = require("../../metadata-manager.js");
var UserManager 	= require("../../user-manager.js");
var ChipManager 	= require("../../chip-types/chip-manager.js");
var ResourceManager = require("../../chip-types/resource-manager.js");

io.listen(config.biz_layer_config.port);


console.log("###############\n    Socket.io started on port " + config.biz_layer_config.port + "\n###############");

io.on('connection', function(socket) {
        console.log("# Web layer connected!!");       

		function convert_to_array(object){
			var arr = [];
			for(var i in object){
				arr.push(object[i]);
			}
			return arr;
		}

        socket.on("request", function(data){
        	var method_name = data.method_name;
        	var arguments = data.arguments;
        	var request_id = data.request_id;
        	console.log("dispatcher-distributed-biz.js", "received request to call method:", method_name);
        	DispatcherDistributedBIZ[method_name]
        		.apply(DispatcherDistributedBIZ, convert_to_array(arguments))
        		.then(function(result){
	        		var response = {};
	        		response.request_id = request_id;
	        		response.payload = result;
	        		socket.emit("response", response);
	        	});
        });

        socket.on("call_service_method", function(data){
        	var service_name = data.service_name;
        	var method_name = data.method_name;
        	var arguments = data.arguments;
        	var request_id = data.request_id;
        	DispatcherDistributedBIZ.call_service_method(service_name, method_name, arguments)
        	.then(function(result){
	        	response.request_id = request_id;
	        	response.payload = result;
	       		socket.emit("response", response);
        	});
        });
        
        //event wylogowania
        socket.on('logout',function(){
                socket.disconnect(); // zamknięcie połączenia
        });
        socket.on('disconnect', function() {
                console.log("Web layer  disconnected"); // event rozłączenia
        });
});

var DispatcherDistributedBIZ = new function(){

	function generateUrl(){
		var remote_settings = config.db_layer_config;
		return "http://" + remote_settings.host + ":" + remote_settings.port;
	}

	this.database_query = function(collection_name, mode, query, options, output_options){
		// tłumaczenie argumentów tego wywołania metody na REST
		query = query || {};
		options = options || {};
		output_options = output_options || {};
		return new Promise(function(resolve, reject){
			if(mode=="find"){
				var url = generateUrl() + "/api/rest/v1/" + collection_name + "/";
				for(var i in query){
					if(query[i] instanceof RegExp){
						query[i] = "$R(" + query[i].toString() + ")"; 
					}
				}
				var query_string = QueryString.stringify({
				  mode: mode,
				  query: JSON.stringify(query),
				  options: JSON.stringify(options),
				  output_options: JSON.stringify(output_options)
				});
				
				//console.log(query_string);


				var entire_url = url+"?"+query_string

				http.get(entire_url, function(err, res, body){
					if(err){
						throw new PrometheusError(err, "find_error", "database-accessor");
						reject(err);
					}else{
						resolve(JSON.parse(body));
					}
				})
			}	
			
			if(mode=="insert"){
				var url = generateUrl() + "/api/rest/v1/" + collection_name + "/";
				var payload = {
				  mode: "insert",
				  query: query,
				  options: options
				};

				var payload_string = JSON.stringify(payload);	


				http.post(url, {form:{json_encoded_payload:payload_string}}, function(err, res, body){
					if(err){
						throw new PrometheusError(err, "insert_error", "database-accessor");
						reject(err);
					}else{
						resolve(JSON.parse(body));
					}
				})
			}	

			if(mode=="update"){
				var url = generateUrl() + "/api/rest/v1/" + collection_name + "/";
				var payload = {
				  mode: "update",
				  query: query,
				  options: options
				};

				var payload_string = JSON.stringify(payload);


				http.put(url, {form:{json_encoded_payload:payload_string}}, function(err, res, body){
					if(err){
						throw new PrometheusError(err, "update_error", "database-accessor");
						reject(err);
					}else{
						resolve(JSON.parse(body));
					}
				})
			}


			if(mode=="delete"){
				var url = generateUrl() + "/api/rest/v1/" + collection_name + "/";
				var payload = {
				  mode: "delete",
				  query: query,
				  options: options
				};

				var payload_string = JSON.stringify(payload);


				http.del(url, {form:{json_encoded_payload:payload_string}}, function(err, res, body){
					if(err){
						throw new PrometheusError(err, "update_error", "database-accessor");
						reject(err);
					}else{
						resolve(JSON.parse(body));
					}
				})
			}

		})
	}


	this.resources_create = function(type_name, body, owner){
		//console.log("DispatcherLocal, create", arguments, "body:", body, "owner", owner);
		return ResourceManager.create_resource(type_name, body, owner, this);
	}

	this.metadata_increment_variable = function(){
//in local mode		
		return MetadataManager.increment_variable.apply(MetadataManager, arguments);
	}

	function call_locally (that, fn, dispatcher){
		return function(){
			var new_arguments = [];
			for(var i in arguments){
				new_arguments.push(arguments[i]);
			}
			new_arguments.push(dispatcher);
			return fn.apply(that, new_arguments);
		}
	}

	this.call_service_method = function(service_name, method_name, arguments){
		new Promise(function(resolve, reject){
			var service = ChipManager.get_service(service_name);
			resolve(service[method_name].apply(service, arguments));
		});
	} 

	this.resources_delete = call_locally(ResourceManager, ResourceManager.delete_resource, this);

	this.resources_list_by_type = call_locally(ResourceManager, ResourceManager.list_by_type, this);

	this.resources_get_by_id = call_locally(ResourceManager, ResourceManager.get_resource_by_id, this);

	this.resources_find = call_locally(ResourceManager, ResourceManager.find_resource, this);

	this.resources_edit_resource_access_mode = call_locally(ResourceManager, ResourceManager.edit_resource_access_mode, this);

	this.resources_search_resource = call_locally(ResourceManager, ResourceManager.search_resource, this);

	this.resources_search_by_mode = call_locally(ResourceManager, ResourceManager.search_by_mode, this);


	var to_delegate = {
		"users": UserManager
	};

	for(var i in to_delegate){
		var that = to_delegate[i];
		for(var j in that){
			this[i+"_"+j]=call_locally(that, that[j], this);
		}
	}


}

module.exports = DispatcherDistributedBIZ;