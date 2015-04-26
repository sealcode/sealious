var io_server = require('socket.io');
var io_client = require('socket.io-client');

var Dispatcher = require("./dispatcher.js");

var ConfigManager = require("../config/config-manager.js");

DispatcherDistributed = function(layer_name){
	this.callback_queue = {};
	this.error_queue = {};
	this.socket_client = null;
	this.socket_server = null;
	this.max_request_id = 0;
	this.layer_name = layer_name;
	ConfigManager.set_default_config(
		"layer_config", 
		{
			"db":{
				"host": "localhost",
				"port": "7766"
			},
			"biz":{
				"host": "localhost",
				"port": "7767"
			}
		}
	);
}

DispatcherDistributed.prototype = Object.create(Dispatcher.prototype);

DispatcherDistributed.prototype.get_request_id = function(){
	this.max_request_id+=1;
	return this.max_request_id;
}

DispatcherDistributed.prototype.add_callback_to_queue = function(id, callback, error_handler){
	this.callback_queue[id] = callback;
	this.error_queue[id] = error_handler;
}

DispatcherDistributed.prototype.resolve_to_callback = function(response_data){
	var callback = this.callback_queue[response_data.request_id];
	callback(response_data.payload);
	delete this.callback_queue[response_data.request_id];
	delete this.error_queue[response_data.request_id];
}

DispatcherDistributed.prototype.resolve_to_error = function(response_error){
	var error_handler = this.error_queue[response_error.request_id];
	if(error_handler){
		error_handler(response_error);		
	}
	delete this.callback_queue[response_error.request_id];
	delete this.error_queue[response_error.request_id];
}


DispatcherDistributed.prototype.call_over_socket = function(method_name, args){
	var id = this.get_request_id();
	this.socket_client.emit("request", {
		method_name: method_name,
		arguments: args,
		request_id: id
	});
	return new Promise(function(resolve, reject){
		this.add_callback_to_queue(id, 
			function(data){
				resolve(data);
			}, 
			function(error){
				Sealious.Logger.error(error);
				reject(new Sealious.Errors.Error(error.error.status_message, error.error));
			}
		);
	}.bind(this))
}	

DispatcherDistributed.prototype.connect_to_layer = function(layer_name){
	var layer_config = ConfigManager.get_config().layer_config;
	if(layer_config[layer_name]==undefined){
		throw new Sealious.Errors.Error("Dispatcher tried to connect to layer of name `" + layer_name + "`, but this layer was not found in config.json.");
	}
	var the_other_layer_config = layer_config[layer_name];
	var connection_url = "http://" + the_other_layer_config.host + ":" + the_other_layer_config.port;

	this.socket_client = io_client.connect(connection_url, {reconnect: true});
	this.socket_client.on("response", function(data){
		this.resolve_to_callback(data);
	}.bind(this));
	this.socket_client.on("throw_error", function(data){
		this.resolve_to_error(data);
	}.bind(this));	
}

DispatcherDistributed.prototype.listen = function(){
	var that = this;
	this.socket_server = io_server();
	var cfg = ConfigManager.get_config().layer_config[this.layer_name];
	this.socket_server.listen(cfg.port);
	Sealious.Logger.info(this.layer_name.toUpperCase() + " layer listening on port: " + cfg.port + "\n");
	this.socket_server.on('connection', function(socket) {
		Sealious.Logger.info("A layer from above connected");

	    socket.on("request", function(data) {
	        var method_name = data.method_name;
	        var arguments = data.arguments;
	        var arguments_array = Object.keys(arguments).map(function (key) {return data.arguments[key]});
	        var request_id = data.request_id;

	        var method_path = method_name.split(".");
	        var method_to_call = that;
	        for (var i = 0; i < method_path.length; i++) {
	            method_to_call = method_to_call[method_path[i]];
	        };

	        method_to_call.apply(that, arguments_array)
	            .then(function(result) {
	                var response = {};
	                response.request_id = request_id;
	                response.payload = result;
	                socket.emit("response", response);
	            }).catch(function(err) {
	            	Sealious.Logger.error(err);
	                var response = {};
	                response.type = "error";
	                response.error = err;
	                response.request_id = request_id;
	                socket.emit("throw_error", response);
	            });
	    });
	    socket.on('logout', function() {
	    	Sealious.Logger.info("Logging out.");
	        socket.disconnect(); // zamknięcie połączenia
	    });
	    socket.on('disconnect', function() {
	        Sealious.Logger.info("Upper layer  disconnected"); // event rozłączenia
	    });
	});

}

DispatcherDistributed.prototype.layer_order = ["web", "biz", "db"]

DispatcherDistributed.prototype.start = function(){
	var current_layer_index = this.layer_order.indexOf(this.layer_name);
	if(this.layer_order[current_layer_index+1]!=undefined){ //if we're not on the bottom-most layer
		this.connect_to_layer(this.layer_order[current_layer_index+1])
	}
	if(this.layer_order[current_layer_index-1]!=undefined){
		this.listen();
	}
}

module.exports = DispatcherDistributed;