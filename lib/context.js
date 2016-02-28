var Immutable = require("immutable");

function Context (timestamp, ip, user_id) {

	this._arguments = arguments;

	if (user_id === undefined) {
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
