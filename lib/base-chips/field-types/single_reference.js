"use strict";
const locreq = require("locreq")(__dirname);
const ResourceType = locreq("lib/chip-types/resource-type.js");
const Action = locreq("lib/action.js");

module.exports = {
	name: "single_reference",
	is_proper_value: function(context, params, new_value){
		const resource_type = new ResourceType(params.resource_type);
		let resource_id;
		if (typeof new_value === "string"){
			resource_id = new_value;
		} else if (typeof new_value === "object"){
			resource_id = new_value.id;
		}
		const action = new Action(["resources", resource_type.name, resource_id], "show");
		return action.perform(context)
		.catch({type: "not_found"}, (error) => Promise.reject(error));
	},
	encode: function(context, params, value_in_code){
		let resource_id;
		if (typeof value_in_code === "string"){
			resource_id = value_in_code;
		} else if (typeof value_in_code === "object"){
			resource_id = value_in_code.id;
		}
		return resource_id;
	},
	format: function(context, params, decoded_value, format_params){
		if (format_params === "expand"){
			if (decoded_value === undefined){
				return undefined;
			}
			const resource_type = new ResourceType(params.resource_type);
			const resource_id = decoded_value;
			const action = new Action(["resources", resource_type.name, resource_id], "show");
			return action.perform(context);
		} else {
			return decoded_value;
		}
	},
	filter_to_query: function(context, params, field_filter){
		// treating filter as a query here
		if (typeof field_filter === "object"){
			const resource_type = new ResourceType(params.resource_type);
			return context.run_action(["resources", resource_type.name], "show", {filter: field_filter})
			.map(function(resource){
				return resource.id;
			}).then(function(id_array){
				return {
					$in: id_array,
				};
			});
		} else {
			return {
				$eq: field_filter,
			};
		}
	},
};
