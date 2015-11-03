var Sealious = require("sealious");

var RootSubject = new function(){
	this.getChildSubject = function(key){
		return Sealious.ChipManager.get_chip("resource_type", key);
	}
}

module.exports = RootSubject;