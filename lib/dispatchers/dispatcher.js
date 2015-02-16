var ChipManager = require("../chip-types/chip-manager.js");

Dispatcher = function(){
	this.datastore_chip = null;
}

Dispatcher.prototype = new function(){

	this.set_datastore_chip = function(datastore_chip){
		this.datastore_chip = datastore_chip;
	}

	this.init = function(){
		this.set_datastore_chip(ChipManager.get_datastore_chip());
	}

}

module.exports = Dispatcher;