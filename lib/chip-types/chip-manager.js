var Errors = require.main.require("lib/response/error.js");
var Logger = require.main.require("lib/logger/logger.js");

var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");

var ConfigurationManager = require("../config/config-manager.js");

var chip_type_functions = {
	channel: 		require("./channel.js"),
	resource_type: 	require("./resource-type.js"),
	field_type: 	require("./field-type.js"),
	datastore: 		require("./datastore.js")
};

var chips = {};

var chip_type_start_order = ["access_strategy", "field_type", "resource_type", "channel"];

var ChipManager = new function(){
	/**
	* Starts chips in proper order.
	* @param {array} chip_types_to_start - array of names of chips we want to start
	* @returns {Promise} - Promise, which will resolve with starting chips or reject with error
	*/
	this.start_chips = function(){
		Logger.info("Starting all chips:");
		var promises = [];
		var datastore = this.get_datastore_chip();

		var promise = datastore.start();
		promises.push(promise);
		Logger.info("\t  \u2713 " + datastore.name);

		for (var i in chip_type_start_order){
			var type = chip_type_start_order[i];
			Logger.info("   " + type + ":");
			for (var name in chips[type]){
				var chip = chips[type][name];
				Logger.info("\t  \u2713 " + name);
				try {
					if (chip.start){
						promise = chip.start();
						promises.push(promise);
					}
				} catch (error){
					Logger.error("\t  " + "couldn't start `" + name + "`");
					return Promise.reject(error);
				}
			}
		}
		return Promise.all(promises);
	};

	this.add_chip = function(type, name, chip){

		if (chips[type] === undefined) {
			chips[type] = [];
		}
		chips[type][name] = chip;
	};

	/**
	* Gets all resource types
	* @returns {array} Array of names of resource types.
	*/

	this.__get_all_resource_types = function(chips){
		var names = [];
		for (var resource_type in chips.resource_type) {
			names.push(resource_type);
		}
		return names;
	};

	this.get_all_resource_types = function(){
		return this.__get_all_resource_types(chips);
	};


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
	};


	this.__get_chip = function(chips, type, name){
		try {
			var ret = chips[type][name];
			if (ret === undefined){
				throw new Error("Chip of type " + type + " and name " + name + " has not yet been registered.");
			}
			return ret;
		} catch (e){
			throw new Errors.ValidationError("ChipManager was asked to return a chip of type `" + type + "` and name `" + name + "`, but it was not found", {}, {short_message: "chip_not_found"});
		}
	};

	this.get_chip = function(type, name){
		return this.__get_chip(chips, type, name);
	};

	/*
	* Gets chip by long id
	* @param {string} longid - longid is chip_type.chip_name ex. chanell.cli
	* @returns {object} requested chip or throws error
	*/

	this.__get_chip_by_longid = function(chips, longid){
		var type = longid.split(".")[0];
		var name = longid.split(".")[1];
		return this.__get_chip(chips, type, name);
	};

	this.get_chip_by_longid = function(longid){
		return this.__get_chip_by_longid(chips, longid);
	};

	this.__get_chip_amount_by_type = function(chips, type){
		if (chips[type]){
			return Object.keys(chips[type]).length;
		} else {
			return 0;
		}
	};

	this.get_chip_amount_by_type = function(type){
		return this.__get_chip_amount_by_type(chips, type);
	};
	/**
	* Gets proper datastore chip
	* @returns {object} datastore chip for application or throws error if no datastore chip is defined
	*/
	this.get_datastore_chip = function(){
		var datastore_chip_amount = this.get_chip_amount_by_type("datastore");
		if (datastore_chip_amount === 0){
			throw new Errors.Error("Chip manager was requested to return the datastore chip, but no chips of type `datastore` have been registered.");
		} else if (datastore_chip_amount === 1){
			return chips["datastore"][Object.keys(chips["datastore"])[0]];
		} else {
			var datastore_chip_name = ConfigurationManager.get_config().datastore_chip_name;
			if (datastore_chip_name === undefined){
				throw Errors.Error("Chip manager was requested to return a datastore chip. Multiple chips of type `datastore` have been registered, and no default provided in configuration.");
			} else {
				return this.get_chip("datastore", datastore_chip_name);
			}
		}
	};

	this.__get_chips_by_type = function(chips, chip_type){
		return chips[chip_type];
	};

	this.get_chips_by_type = function(chip_type){
		return this.__get_chips_by_type(chip_type);
	};
};


module.exports = ChipManager;
