var chip = function(){}

chip.prototype = new function(){
	this.configure = function(config){
		this.configuration = this.default_configuration;
		if(!this.configuration){
			this.configuration={};
		}
		for(var key in config){
			this.configuration[key] = config[key];
		}
	}	

	this.start = function(){
		//to be overwritten
		return new Promise(function(resolve, reject){
			resolve();
		})	
	}
}

module.exports = chip;