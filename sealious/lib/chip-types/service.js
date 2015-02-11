var Promise = require("bluebird");

var Service = function(id, mode){
	this.id = id;
	this.event_handlers = {};
}

Service.prototype = new function(){

	this.on = function(event_name, callback){
		if(!this.event_handlers[event_name]){
			this.event_handlers[event_name] = callback;
		}
	}

	this.fire_action = function(event_name, payload){
		var that = this;
		return new Promise(function(resolve, reject){
			if(!that.event_handlers[event_name]){
				throw new Error("event ", event_name, "does not have a handler attached");
			}else{
				that.event_handlers[event_name](payload, function(){
					resolve();
				});
			}			
		})
	}

	this.prepare = function(){
		return true;
	}

	this.start = function(){
		return true;
	}
}

module.exports = Service;
