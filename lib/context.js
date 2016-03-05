var Sealious = require("sealious");

function Context (timestamp, ip, user_id) {


	if (arguments.length === 1 && arguments[0] instanceof Context){
		ip = arguments[0].ip;
		user_id = arguments[0].user_id;
	}

	Object.defineProperty(this, "_arguments", arguments);

	if (user_id === undefined || user_id === false) {
		user_id = null;
	}

	if (timestamp === undefined) {
		var d = new Date();
		timestamp = d.getTime();
	}

	this.timestamp = timestamp;
	this.ip = ip || null;
	this.user_id = user_id;
}

Context.prototype = new function(){
	this._get_constructor_arguments = function(){
		return this._arguments;
	}
}

module.exports = Context;
