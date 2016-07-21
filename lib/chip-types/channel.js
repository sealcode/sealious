const chip = require("./chip.js");
const ChipManager = require.main.require("lib/chip-types/chip-manager");

/*
Represents channel.
@constructor
@param {string} name - name of channel
return void
*/
function channel (name){
	this.name = name;
	this.longid = `channel.${name}`;
	this.default_configuration = {};
	ChipManager.add_chip("channel", this.name, this);
}

channel.prototype = new chip();

module.exports = channel;
