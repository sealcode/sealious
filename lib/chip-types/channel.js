var chip = require("./chip.js");

function channel(longid){
	this.longid = longid;
}

channel.prototype  = new chip();

channel.is_a_constructor = false;

module.exports = channel;