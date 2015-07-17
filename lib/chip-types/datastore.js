var Sealious = require("../main.js");
var Chip = require("./chip.js");

var Datastore = function(parent_module_path, name){
	this.name = name;
	this.longid = "datastore."+name;
	this.default_configuration = {};
	Sealious.ChipManager.add_chip("datastore", this.name, this, parent_module_path);
}

Datastore.is_a_constructor = false;

Datastore.prototype = new Chip();

Datastore.prototype.return_not_implemented = function(fn_name){
	return function(){
		throw new Sealious.Errors.DeveloperError("Function ", fn_name, "not implemented in ", this.longid, ", aborting."); 
	}
}

var needs_to_implement = ["find", "insert", "update", "remove"]
for(var i in needs_to_implement){
	var fn_name = needs_to_implement[i];
	Datastore.prototype[fn_name] = Datastore.prototype.return_not_implemented(fn_name)
}

module.exports = Datastore;