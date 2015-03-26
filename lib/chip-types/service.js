var Promise = require("bluebird");
var SealiousErrors = require("../response/error.js");


var Service = function(longid, mode){
	this.longid = longid;
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
				throw new SealiousErrors.ValidationError("event ", event_name, "does not have a handler attached"); //~
			}else{
				that.event_handlers[event_name](payload, function(){
					resolve();
				});
			}			
		})
	}

	this.start = function(){
		return true;
	}
}

Service.is_a_constructor = false;

module.exports = Service;