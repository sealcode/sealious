var Sealious = require("../main.js");
var chip = require("./chip.js");

function channel(parent_module_path, name){
	this.name = name;
	this.longid = "channel."+name;
	this.default_configuration = {};
	Sealious.ChipManager.add_chip("channel", this.name, this, parent_module_path);
}

channel.prototype  = new chip();

module.exports = channel;