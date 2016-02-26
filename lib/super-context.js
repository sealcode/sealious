var Sealious = require("sealious");

var SuperContext = function(){};

SuperContext.prototype = new function(){
	this.toObject = function(){return {}};

	this.get = function(){return ""};
}

module.exports = SuperContext;
