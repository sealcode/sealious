var Promise = require("bluebird");
var config = require("prometheus-config");
var io_client = require('socket.io-client')
var ip=require('ip');

var DispatcherDistributedWEB = new function(){

	var server_config = null;

	var socket = null;

	var max_request_id = 0;

	var callback_queue = {};

	function getRequestId(){
		max_request_id+=1;
		return max_request_id;
	}

	function addCallbackToQueue(id, callback){
		callback_queue[id] = callback;
	}

	function resolveToCallback(response_data){
		var callback = callback_queue[response_data.request_id];
		callback(response_data.payload);
		delete callback_queue[response_data.request_id];
	}

	function generateBizUrl(){
		var cfg = config.biz_layer_config;
		return "http://" + cfg.host + ":" + cfg.port;
	}

	this.init = function(){
		var biz_url = generateBizUrl();
		socket = io_client.connect(biz_url, {reconnect: true});
		socket.on("response", function(data){
			resolveToCallback(data);
		})
	}

	function call_over_socket(method_name, args){
		//console.log("sending method call to ", method_name, ", with ", args);
		var id = getRequestId();
		socket.emit("request", {
			method_name: method_name,
			arguments: args,
			request_id: id
		});
		return new Promise(function(resolve, rejected){
			addCallbackToQueue(id, function(data){
				resolve(data);
			})
		})
	}

	var functions_resolved_by_socket = [
		"request_update",
		"fire_service_action",
		"resources_list_by_type",
		"resources_create",
		"metadata_increment_variable",
		"resources_delete",
		"resources_find",
		"resources_get_by_id",
		"resources_edit_resource_access_mode",
		"resources_search_by_mode",
		"users_get_all_users",
		"users_user_exists",
		"users_password_match",
		"users_get_all_users",
		"users_get_user_data",
		"users_update_user_data",
		"users_delete_user",
		"users_create_user",
		"resources_search_resource"
	];	

	for(var i in functions_resolved_by_socket){
		var function_name = functions_resolved_by_socket[i];
		this[function_name] = (function(name){
			return function(){
				return call_over_socket(name, arguments);
			}
		})(function_name);
	}	

}

module.exports = DispatcherDistributedWEB;
