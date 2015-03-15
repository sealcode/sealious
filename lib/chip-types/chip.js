var Promise = require("bluebird");

var chip = function(){
	this.configuration = {};
	Object.defineProperty(this, "default_configuration", {
		set: this.apply_default_settings
	})	
}

chip.prototype = new function(){

	this.apply_default_settings = function(default_config){
		for(var i in default_config){
			if(!this.configuration[i]){
				this.configuration[i]=default_config[i];
			}
		}
	}

	this.configure = function(config){
		config = config || {};
		this.configuration = config;
	}	

	this.start = function(){
		//to be overwritten
		return new Promise(function(resolve, reject){
			resolve();
		})	
	}
}


module.exports = chip;