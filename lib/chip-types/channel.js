var Sealious = require("sealious");
var chip = require("./chip.js");

/*
Represents channel.
@constructor
@param {string} name - name of channel
return void
*/
function channel (name) {
	this.name = name;
	this.longid = "channel." + name;
	this.default_configuration = {};
	Sealious.ChipManager.add_chip("channel", this.name, this);
}

channel.prototype = new chip();

module.exports = channel;