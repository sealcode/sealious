var fs = require("fs");
var path = require('path')
var Set = require('Set');

var chip_type_functions = {
	channel: 		require("./channel.js"),
	service: 		require("./service.js"),
	resource_type: 	require("./resource-type.js"),
	field_type: 	require("./field-type.js")
}

chips_by_module = {};

var started_chips_longids = new Set();

var chips = {};

var registred_chips_longids = new Set();

var ChipManager = new function(){

	function add_chip(type, name, chip, module_path){
		if(chips[type]==undefined){
			chips[type]=[];
		}
		chips[type][name]=chip;
		if(chips_by_module[module_path]==undefined){
			chips_by_module[module_path]=[];
		}
		chips_by_module[module_path].push(chip);
	}

	this.perform_chip_action = function(module_path, action_description, dispatcher){
		var dependencies = {};
		chip_description = action_description.chip_description;
		chip_description.requires.map(function(required_chip_description){
			var longid = required_chip_description.longid;
			dependencies[longid] = ChipManager.get_chip_by_longid(longid);
		});
		switch(action_description.verb){
			case "define":
				var creator_function = chip_type_functions[chip_description.type];
				if(creator_function.is_a_constructor){
					var chip_instance = function(){};
					chip_instance.prototype = Object.create(creator_function.prototype);
					chip_instance.longid = chip_description.longid;
				}else{
					var chip_instance = new creator_function(chip_description.longid, ChipManager);
				}
				add_chip(chip_description.type, chip_description.name, chip_instance, module_path);
				break;
			case "use":
				var chip_instance = ChipManager.get_chip_by_longid(chip_description.longid);
				break;				
		}
		var action_handler_function = require(module_path + "/" + action_description.verb + "/" + chip_description.longid + ".js");
		action_handler_function(chip_instance, dispatcher, dependencies);
	}

	this.get_chip = function(type, name){
		console.log(chips["field_type"]["email"]==chips["field_type"]["text"]);
		return chips[type][name];
	}

	this.get_chip_by_longid = function(longid){
		var type = longid.split(".")[0];
		var name = longid.split(".")[1];
		return chips[type][name];
	}

	this.start_chips_from_module = function(module_path){
		var chips_to_start = chips_by_module[module_path] || [];
		chips_to_start.forEach(function(chip){
			if(!started_chips_longids.has(chip.longid)){
				chip.start && chip.start();
				started_chips_longids.add(chip.longid);				
			}
		})
	}

	this.chip_is_registred = function(longid){
		return this.get_chip_by_longid(longid) != undefined;
	}
}


module.exports = ChipManager;
	
