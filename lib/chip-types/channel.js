"use strict";
const locreq = require("locreq")(__dirname);
const chip = require("./chip.js");
const ChipManager = locreq("lib/chip-types/chip-manager");

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
