var Promise = require("bluebird");
var io_client = require('socket.io-client')
var ip=require('ip');

var Dispatcher = require("../dispatcher.js");

var config = require("../../config/config-manager.js").getConfiguration();

var DispatcherDistributedWEB = Object.create(Dispatcher.prototype);

var server_config = null;

var socket = null;

var max_request_id = 0;

var callback_queue = {};
var error_queue = {};


function getRequestId(){
	max_request_id+=1;
	return max_request_id;
}

function addCallbackToQueue(id, callback, error_handler){
	callback_queue[id] = callback;
	error_queue[id] = error_handler;
}

function resolveToCallback(response_data){
	var callback = callback_queue[response_data.request_id];
	callback(response_data.payload);
	delete callback_queue[response_data.request_id];
	delete error_queue[response_data.request_id];
}

function resolveToError(response_error){
	var error_handler = error_queue[response_error.request_id];
	error_handler(response_error);
	delete callback_queue[response_error.request_id];
	delete error_queue[response_error.request_id];
}

function generateBizUrl(){
}

function call_over_socket(method_name, args){
	//console.log("sending method call to ", method_name, ", with ", args);
	var id = getRequestId();
	socket.emit("request", {
		method_name: method_name,
		arguments: args,
		request_id: id
	});
	return new Promise(function(resolve, reject){
		addCallbackToQueue(id, function(data){
			console.log("dispatcher-web.js data", data);
			resolve(data);
		}, function(error){
			console.log("error in promise:", error);
			reject(error)
		});
	})
}

DispatcherDistributedWEB.process_resource_manager_method = function(ResourceManager, method_name){
	return function(){
		return call_over_socket("resources." + method_name, arguments);
	}
}

DispatcherDistributedWEB.process_service_method = function(service, service_name, method_name){
	return function(){
		return call_over_socket("services." + service_name + "." + method_name, arguments);
	}
}

DispatcherDistributedWEB.start = function(){
	var cfg = config.biz_layer_config;
	var biz_url = "http://" + cfg.host + ":" + cfg.port;
	socket = io_client.connect(biz_url, {reconnect: true});
	socket.on("response", function(data){
		resolveToCallback(data);
	})
	socket.on("throw_error", function(data){
		resolveToError(data);
	})	
}

module.exports = DispatcherDistributedWEB;
