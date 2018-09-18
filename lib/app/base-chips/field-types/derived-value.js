const locreq = require("locreq")(__dirname);
const Errors = locreq("lib/response/error.js");
const Promise = require("bluebird");

module.exports = app => ({
	name: "derived-value",
	get_description: () =>
		"A value derived from an array of fields of the given collection.",
	get_default_value: async () => null,
	is_proper_value: function(context, params, new_value) {
		return this._call_base_method(
			"is_proper_value",
			context,
			params,
			new_value
		);
	},
	filter_to_query: async function(context, params, field_filter) {
		return this._call_base_method(
			"filter_to_query",
			context,
			params,
			field_filter
		);
	},
	init: function(collection, field_name, params) {
		const { fields, derived_fn, base_field_type } = params;
		if (typeof derived_fn !== "function") {
			throw new Error(
				`'derived_fn' param in ${field_name} derived-value field is not a function.`
			);
		}

		if (!Array.isArray(fields)) {
			throw new Error(
				`'fields' param in ${field_name} derived-value field is not an array.`
			);
		}

		const not_matching_fields = fields.filter(
			field => !Object.keys(collection.fields).includes(field)
		);

		if (not_matching_fields.length) {
			throw new Error(
				`Missing declaration for fields from derived-value params: ${not_matching_fields
					.map(field => `'${field}'`)
					.join(", ")} in ${
					collection.name
				} collection. REMEMBER: 'derived-value' field must be declared *after* the fields it depends on.`
			);
		}

		app.addHook(
			new app.Sealious.EventMatchers.Collection({
				when: "before",
				collection_name: collection.name,
				action: "create",
			}),
			async (emitted_event, params) => {
				this._call_is_proper_value_for_params(params, collection);
				const derived_fn_args = fields.map(
					field =>
						params[field] === undefined || params[field] === null
							? ""
							: params[field]
				);
				const derived_value = await derived_fn(...derived_fn_args);
				return {
					[field_name]: derived_value,
					...params,
				};
			}
		);

		app.addHook(
			new app.Sealious.EventMatchers.Resource({
				when: "before",
				collection_name: collection.name,
				action: "edit",
			}),
			async ({ metadata, subject_path }, params) => {
				this._call_is_proper_value_for_params(
					metadata.context,
					params,
					collection
				);

				if (fields.some(field => Object.keys(params).includes(field))) {
					const derived_fn_args = await Promise.map(
						fields,
						async current_field => {
							if (Object.keys(params).includes(current_field)) {
								return params[current_field];
							}
							const resource = await app.run_action(
								new app.Sealious.SuperContext(),
								subject_path.split("."),
								"show"
							);
							return resource[current_field];
						}
					);
					const derived_value = await derived_fn(...derived_fn_args);

					return {
						...params,
						[field_name]: derived_value,
					};
				}
				return params;
			}
		);
	},

	encode: async function(context, params, value) {
		return this._call_base_method("encode", context, params, value);
	},
	decode: function(context, params, value_in_db) {
		return this._call_base_method("decode", context, params, value_in_db);
	},
	format: function(context, params, decoded_value, format) {
		return this._call_base_method(
			"format",
			context,
			params,
			decoded_value,
			format
		);
	},

	async _call_is_proper_value_for_params(context, event_params, collection) {
		for (param_field in event_params) {
			try {
				await collection.fields[param_field].type.is_proper_value(
					context,
					collection.fields[param_field].params,
					event_params[param_field]
				);
			} catch (e) {
				return;
			}
		}
	},

	_call_base_method(method, context, params, ...rest) {
		const base_field_type = app.FieldType(params.base_field_type.name);
		return base_field_type[method](
			context,
			params.base_field_type.params || {},
			...rest
		);
	},
});
