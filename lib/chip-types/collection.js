"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const merge = require("merge");
const clone = require("clone");

const Errors = locreq("lib/response/error.js");
const Chip = require("./chip.js");
const Field = require("./field.js");
const CalculatedField = require("./calculated-field.js");
const AccessStrategy = require("./access-strategy.js");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");


const Collection = function(app, declaration){
	if (typeof declaration === "string"){
		return app.ChipManager.get_chip("collection", declaration);
	} else if (declaration instanceof Collection){
		return declaration;
	}

	const self = this;

	Chip.call(this, "collection", declaration.name);
	this.app = app;
	this.name = declaration.name;
	this.fields = {};
	this.human_readable_name = declaration.human_readable_name;
	this.summary = declaration.summary;
	this.access_strategy = {
		default: new AccessStrategy(app, "public", {}),
	};
	if (declaration){
		if (declaration.fields){
			for (let i = 0; i < declaration.fields.length; i++){
				if (declaration.fields[i].params){
					if (typeof declaration.fields[i].params !== "object"){
						throw new Errors.ValidationError(`In field "${declaration.fields[i].name}": "params" is of wrong type, it should be an object`);
					}
				}
			}
			this.add_fields(declaration.fields);
		}

		this.calculated_fields = [];
		if(declaration.calculated_fields){
			for(const calc_field_name in declaration.calculated_fields){
				const calc_field_type_declaration = declaration.calculated_fields[calc_field_name][0];
				const calc_field_type_params = declaration.calculated_fields[calc_field_name][1];
				this.add_calculated_field(calc_field_name, calc_field_type_declaration, calc_field_type_params);
			}
		}

		this.set_access_strategy(declaration.access_strategy);
	}
};

Collection.type_name = "collection";

Collection.pure = {
	add_field: function(app, field_type, fields, field_declaration){
		const field_object = new Field(app, field_declaration, field_type);
		const field_name = field_object.name;
		if (!fields[field_name]){
			fields[field_name] = field_object;
		} else {
			throw new Errors.DeveloperError(`Duplicate field names: "${field_name}" in collection: "${field_type.name}"`);
		}
	},
	add_fields: function(app, field_type, fields, field_declarations_array){
		for (const i in field_declarations_array){
			const declaration = field_declarations_array[i];
			Collection.pure.add_field(app, field_type, fields, declaration);
		}
	},
	add_calculated_field: function(app, collection, calc_field_name, calc_field_type_declaration, calc_field_type_params){
		collection.calculated_fields[calc_field_name] = new CalculatedField(app, calc_field_name, calc_field_type_declaration, calc_field_type_params);
	},
	get_unknown_field_errors: function(field_type_name, fields, values){
		const validation_errors = {};
		for (const field_name in values){
			if (fields[field_name] === undefined){
				validation_errors[field_name] = new Errors.ValidationError(`Unknown field '${field_name}' for resource-type '${field_type_name}`);
			}
		}
		return validation_errors;
	},
	get_missing_values_checker: function(fields, values, assume_delete_value_on_missing_key, old_values){
		if (assume_delete_value_on_missing_key){
			return function(field_name){
				return fields[field_name].required && values[field_name] === undefined;
			};
		} else {
			return function(field_name){
				return fields[field_name].required && values[field_name] === undefined && old_values[field_name] === undefined;
			};
		}
	},
	get_missing_field_values_errors: function(fields, values, assume_delete_value_on_missing_key, old_values){
		const errors = {};
		const checker_fn = Collection.pure.get_missing_values_checker(fields, values, assume_delete_value_on_missing_key, old_values);

		return Promise.filter(Object.keys(fields), checker_fn)
		.each(function(field_name){
			errors[field_name] = new Errors.ValidationError(`Missing value for field '${  field_name  }'`);
		}).then(function(){
			return errors;
		});
	},
	get_invalid_field_values_errors: function(fields, context, values, old_values){
		const errors = {};
		const promises = [];
		for (const field_name in values){
			if (fields[field_name]){
				const value = values[field_name];
				const old_value = old_values? old_values[field_name] : undefined;
				const promise = fields[field_name].is_proper_value(context, value, old_value)
					.catch(function(error){
						if(typeof error === "string" || error.type === "validation"){
							errors[field_name] = new Errors.ValidationError(error);
						}else{
							throw error;
						}
					});
				promises.push(promise);
			}
		}
		return Promise.all(promises)
		.then(function(){
			return errors;
		});
	},
	validate_field_values: function(field_type_name, fields, context, assume_delete_value_on_missing_key, new_values, old_values){
		const errors_array = [
			Collection.pure.get_unknown_field_errors(field_type_name, fields, new_values),
			Collection.pure.get_missing_field_values_errors(fields, new_values, assume_delete_value_on_missing_key, old_values),
			Collection.pure.get_invalid_field_values_errors(fields, context, new_values, old_values)
		];

		return Promise.all(errors_array)
			.reduce(merge)
			.then(function(errors){
				const user_errors = {};
				const non_user_errors = {};
				for (const field_name in errors){
					const error = errors[field_name];
					if (error.is_user_fault){
						user_errors[field_name] = error;
					} else {
						non_user_errors[field_name] = error;
					}
				}
				const non_user_errors_amount = Object.keys(non_user_errors).length;
				if (non_user_errors_amount > 0){
					throw non_user_errors[Object.keys(non_user_errors)[0]];
				}
				const user_errors_amount = Object.keys(user_errors).length;
				if (user_errors_amount > 0){
					throw new Errors.ValidationError("There are problems with some of the provided values.", user_errors);
				}
			});
	},
	encode_field_values: function(fields, context, body, old_body){
		const promises = {};
		for (const field_name in body){
			const current_value = body[field_name];
			if (current_value === undefined){
				promises[field_name] = null;
			} else {
				const old_value = old_body && old_body[field_name];
				promises[field_name] = fields[field_name].encode(context, current_value, old_value);
			}
		}
		return Promise.props(promises);
	},
	get_specification: function(name, human_readable_name, summary, fields, with_validators){
		// with_validators:boolean - whether to include validator functions in field descriptions. Warning! If set to true, the output is not serializable in JSON.
		const collection_specification = {};
		for (const field_name in fields){
			const field_specification = fields[field_name].get_specification(with_validators);
			collection_specification[field_name] = field_specification;
		}

		const specification = {
			name: name,
			human_readable_name: human_readable_name,
			summary: summary,
			fields: collection_specification
		};
		return specification;
	},
	set_access_strategy: function(app, collection, strategy_declaration){
		if (typeof strategy_declaration === "string" ||
			strategy_declaration instanceof AccessStrategyType ||
			strategy_declaration instanceof Array){
			collection.access_strategy = {
				"default": new AccessStrategy(strategy_declaration)
			};
		} else if (typeof strategy_declaration === "object"){
			for (const action_name in strategy_declaration){
				const access_strategy = strategy_declaration[action_name];
				collection.access_strategy[action_name] = new AccessStrategy(app, access_strategy);
			}
		}
	},
	get_access_strategy: function(access_strategy_map, action_name){
		const ret = access_strategy_map[action_name] || access_strategy_map["default"];
		return ret;
	},
	has_large_data_fields: function(fields){
		for (const i in fields){
			const field = fields[i];
			if (field.type.handles_large_data){
				return true;
			}
		}
		return false;
	},
	is_old_value_sensitive: function(fields, action_name){
		for (const i in fields){
			if (fields[i].type.is_old_value_sensitive(action_name)){
				return true;
			}
		}
		return false;
	},
	decode_values: function(fields, context, values){
		const decoded_values = {};
		for (const key in fields){
			const value = values[key];
			const field = fields[key];
			if (field === undefined){
				continue;
			}
			decoded_values[key] = field.decode(context, value);
		}
		return Promise.props(decoded_values);
	},
	format_decoded_values: function(fields, context, decoded_values, format){
		const formatted_values = clone(decoded_values);
		for (const field_name in formatted_values){
			const field_format = format[field_name] || undefined;
			const decoded_value = decoded_values[field_name];
			formatted_values[field_name] = fields[field_name].format(context, decoded_value, field_format);
		}
		return Promise.props(formatted_values);
	},
	_get_body: function(fields, context, db_document, format){
		const decoded_values = Collection.pure.decode_values(fields, context, db_document.body);
		return decoded_values.then(function(decoded_values){
			return Collection.pure.format_decoded_values(fields, context, decoded_values, format || {});
		});
	},
	_get_calculated_fields: function(context, calculated_fields, representation, raw_db_entry){
		const ret = {};
		for(const field_name in calculated_fields){
			ret[field_name] = calculated_fields[field_name].get_value(
				context,
				representation,
				raw_db_entry
			);
		}
		return Promise.props(ret);
	},
	get_resource_representation: function(fields, field_type_name, context, db_document, format, calculated_fields, calculate){
		if(calculate === undefined) calculate = true;
		const representation = {};
		representation.created_context = db_document.created_context;
		representation.last_modified_context = db_document.last_modified_context;
		representation.id = db_document.sealious_id;
		representation.collection_name = field_type_name;
		representation.body = Collection.pure._get_body(fields, context, db_document, format);
		if(calculate){
			representation.calculated_fields = Collection.pure._get_calculated_fields(context, calculated_fields, representation, db_document);
		}
		return Promise.props(representation).then(function(res){
			return res;
		});
	},
	check_if_action_is_allowed: function(access_strategy_map, context, action_name, resource_representation){
		const access_strategy = Collection.pure.get_access_strategy(access_strategy_map, action_name);

		return access_strategy.check(context, resource_representation)
		.then(function(results){
			return results;
		});
	},
	get_aggregation_stages: function(access_strategy_map, fields, context, action_name, query_params){
		const access_strategy = Collection.pure.get_access_strategy(access_strategy_map, action_name);
		return Promise.all([
			(query_params.search? [{$match: {$text:{$search: query_params.search.toString(), $caseSensitive: false, $diacriticSensitive: false}}}] : []),
			access_strategy.get_pre_aggregation_stage(context),
			Object.keys(fields).map((field_name)=>fields[field_name].get_aggregation_stages(context, query_params)),
		])
		.map(Promise.all)
		.reduce((a,b) => a.concat(b), [])
		.reduce((a,b) => a.concat(b), []);
	}
};

const pure = Collection.pure;

// not all pure methods are linked here, because they are not intended to be called from outside

Collection.prototype = {
	add_field(field_declaration){ return pure.add_field(this.app, this, this.fields, field_declaration);},
	add_fields(field_declarations_array){ return pure.add_fields(this.app, this, this.fields, field_declarations_array);},
	add_calculated_field(calc_field_name, type_declaration, type_params){ return pure.add_calculated_field(this.app, this, calc_field_name, type_declaration, type_params);},
	validate_field_values(context, assume_delete_value_on_missing_key, new_values, old_values){
		return pure.validate_field_values(this.name, this.fields, context, assume_delete_value_on_missing_key, new_values, old_values);
	},
	encode_field_values(context, body, old_body){ return pure.encode_field_values(this.fields, context, body, old_body);},
	get_specification(with_validators){ return pure.get_specification(this.name, this.human_readable_name, this.summary, this.fields, with_validators);},
	set_access_strategy(strategy_declaration){ return pure.set_access_strategy(this.app, this, strategy_declaration); },
	get_access_strategy(action_name){return pure.get_access_strategy(this.access_strategy, action_name);},
	has_large_data_fields(){ return pure.has_large_data_fields(this.fields);},
	is_old_value_sensitive(action_name){return pure.is_old_value_sensitive(this.fields, action_name);},
	decoded_values(context, values){return pure.decode_values(this.fields, context, values);},
	format_decoded_values(context, decoded_values, format){ return pure.format_decoded_values(this.fields, context, decoded_values, format);},
	get_resource_representation(context, db_document, format, calculate){ return pure.get_resource_representation(this.fields, this.name, context, db_document, format, this.calculated_fields, calculate);},
	check_if_action_is_allowed(context, action_name, resource_representation){ return pure.check_if_action_is_allowed(this.access_strategy, context, action_name, resource_representation);},
	get_aggregation_stages(context, action_name, query_params){return pure.get_aggregation_stages(this.access_strategy, this.fields, context, action_name, query_params);}
};

Collection.prototype.decode_db_entry = Collection.prototype.get_resource_representation;

module.exports = Collection;
