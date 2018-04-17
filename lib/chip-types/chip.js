"use strict";
const Promise = require("bluebird");

let ChipManager;

const Chip = function(type, name) {
	this.type = type;
	this.name = name;
	this.longid = `${type}.${name}`;
};

Chip.prototype.start = function() {
	// to be overwritten
	return Promise.resolve();
};

module.exports = Chip;
