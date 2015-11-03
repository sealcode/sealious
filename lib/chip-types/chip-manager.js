var Sealious = require("../main.js");

var fs = require("fs");
var path = require('path')
var Set = require('Set');
var Promise = require("bluebird");

var ConfigurationManager = require("../config/config-manager.js");

var chip_type_functions = {
	channel: 		require("./channel.js"),
	resource_type: 	require("./resource-type.js"),
	field_type: 	require("./field-type.js"),
	datastore: 		require("./datastore.js")
}

var chips_by_module = {};

var started_chips_longids = new Set();

var chips = {};

var chip_type_start_order = ["datastore", "access_strategy", "field_type", "resource_type", "channel"];

var registred_chips_longids = new Set();

var ChipManager = new function(){
	/**
	* Starts chips in proper order.
	* @param {array} chip_types_to_start - array of names of chips we want to start
	* @returns {Promise} - Promise, which will resolve with starting chips or reject with error
	*/
	this.start_chips = function(){
		Sealious.Logger.info("Starting all chips:");
		var promises = [];
		for (var i in chip_type_start_order){
			var type = chip_type_start_order[i];
			Sealious.Logger.info("   " + type + ":");
			for (var name in chips[type]){
				var chip = chips[type][name];
				Sealious.Logger.info("\t  \u2713 " + name);
				try {
					if (chip.start){
						var promise = chip.start();
						promises.push(promise);
					}
				} catch (error){
					Sealious.Logger.error("\t  " + "couldn't start `" + name + "`");
					return Promise.reject(error);
				}
			}
		}
		return Promise.all(promises);
	}

	/**
	* Adds chip to chips array and chips_by_module array
	* @param {string} type - chip type ex. access-strategy, channel
	* @param {string} name - chip name
	* @param {object} chip - chip itselfs
	* @returns void
	*/
	this.add_chip = function(type, name, chip){
		if (chips[type] === undefined){
			chips[type] = [];
		}
		chips[type][name] = chip;
	}

	/**
	* Gets all resource types
	* @returns {array} Array of names of resource types.
	*/

	this.get_all_resource_types = function(){
		var names = [];
		for (var resource_type in chips.resource_type) {
			names.push(resource_type);
		}

		return names;
	}
	/**
	* Checks if chip exists
	* @param {string} type - chip type
	* @param {string} name - chip name
	* @returns {boolean} true if exists, otherwise false
	*/
	this.chip_exists = function(type, name){
		if (chips[type] && chips[type][name]){
			return true;
		} else {
			return false;
		}
	}

	/**
	* Gets chip
	* @param {string} type - chip type
	* @param {string} name - chip name
	* @returns {object} requested chip or throws error
	*/
	this.get_chip = function(type, name){
		try {
			var ret = chips[type][name];
			if (ret === undefined){
				throw new Error("Chip of type " + type + " and name " + name + " has not yet been registered.");
			}
			return ret;
		} catch (e){
			throw new Sealious.Errors.ValidationError("ChipManager was asked to return a chip of type `" + type + "` and name `" + name + "`, but it was not found", {}, {short_message: "chip_not_found"});
		}
	}

	/*
	* Gets chip by long id
	* @param {string} longid - longid is chip_type.chip_name ex. chanell.cli
	* @returns {object} requested chip or throws error
	*/
	this.get_chip_by_longid = function(longid){
		var type = longid.split(".")[0];
		var name = longid.split(".")[1];
		return this.get_chip(type, name);
	}

	/*
	* Checks if chip is registered
	* @param {string} longid - longid is chip_type.chip_name ex. chanell.cli
	* @returns {boolean} true if chip is registered, otherwise false
	*/
	this.chip_is_registred = function(longid){
		return this.get_chip_by_longid(longid) !== undefined;
	}

	/*
	Gets amount of chips in given type
	* @param {string} type - type name ex. chanell, access_strategy
	* @returns {integer} amount of chips of this type
	*/
	this.get_chip_amount_by_type = function(type){
		if (chips[type]){
			return Object.keys(chips[type]).length;
		} else {
			return 0;
		}
	}
	/**
	* Gets proper datastore chip
	* @returns {object} datastore chip for application or throws error if no datastore chip is defined
	*/
	this.get_datastore_chip = function(){
		var datastore_chip_amount = this.get_chip_amount_by_type("datastore");
		if (datastore_chip_amount === 0){
			throw new Sealious.Errors.Error("Chip manager was requested to return the datastore chip, but no chips of type `datastore` have been registered.")
		} else if (datastore_chip_amount === 1){
			return chips["datastore"][Object.keys(chips["datastore"])[0]]
		} else {
			var datastore_chip_name = ConfigurationManager.get_config().datastore_chip_name;		
			if (datastore_chip_name === undefined){
				throw new Sealious.Errors.Error("Chip manager was requested to return a datastore chip. Multiple chips of type `datastore` have been registered, and no default provided in configuration.")	
			} else {
				return this.get_chip("datastore", datastore_chip_name);
			}			
		}
	}
	/**
	* Gets all chips of given type
	* @param {string} chip type name ex. channel, access_strategy
	* @returns {array} Array of chips of given type.
	*/

	this.get_chips_by_type = function(chip_type){
		return chips[chip_type];
	}
}


module.exports = ChipManager;
