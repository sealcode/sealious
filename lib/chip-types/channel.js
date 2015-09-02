var Sealious = require("../main.js");
var chip = require("./chip.js");

/*
Represents channel.
@constructor
@param {string} parent_module_path - currently not used
@param {string} name - name of channel
return void
*/
function channel(parent_module_path, name){
	this.name = name;
	this.longid = "channel."+name;
	this.default_configuration = {};
	Sealious.ChipManager.add_chip("channel", this.name, this, parent_module_path);
}

channel.prototype  = new chip();

module.exports = channel;