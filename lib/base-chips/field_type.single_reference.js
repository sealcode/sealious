var Sealious = require("sealious");

module.exports = new Sealious.FieldType({
	name: "single_reference",
	is_proper_value: function(accept, reject, context, params, new_value){
		var resource_type = new Sealious.ResourceType(params.resource_type);
		var resource_id = new_value;
		var action = new Sealious.Action(["resources", resource_type.name, resource_id], "show");
		action.perform(context).then(accept).catch((error) => reject(error));
	},
	decode: function(context, params, value_in_database){
		var resource_type = new Sealious.ResourceType(params.resource_type);
		var resource_id = value_in_database;
		var action = new Sealious.Action(["resources", resource_type.name, resource_id], "show");
		return action.perform(context);
	}
})
