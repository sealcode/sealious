var chip = require("./chip.js");

function channel(longid){
	this.longid = longid;
	this.default_configuration = {};
}

channel.prototype  = new chip();

channel.is_a_constructor = false;

module.exports = channel;