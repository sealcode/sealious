var chip = function(){}

chip.prototype = new function(){
	this.configure = function(config){
		this.configuration = this.default_configuration;
		if(!this.configuration){
			this.configuration={};
		}
		for(var key in config){
			console.log("I am being configured with ", key, ":", config[key]);
			this.configuration[key] = config[key];
		}
	}	

	this.start = function(){
		//to be overwritten
		return true;	
	}
}

module.exports = chip;