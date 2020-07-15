import Bluebird from "bluebird";

import * as Errors from "../response/errors";
import Field from "./field";
import CalculatedField from "./calculated-field";
import Policy, { PolicyDefinition } from "./policy";

import SingleItemResponse from "../../common_lib/response/single-item-response";
import App from "../app/app";
import { ActionName } from "../action";
import Context from "../context";

type values<T = any> = { [field_name: string]: T };

import { FieldDefinition } from "./field";
import Item from "../../common_lib/response/item";
import Query, { QueryStage } from "../datastore/query";
import SpecialFilter from "./special-filter";
import Public from "../app/policy-types/public";
import { ErrorLikeObject } from "../response/errors";

export type CollectionDefinition = {
	name: string;
	fields: FieldDefinition<any>[];
	policy?: Partial<
		{
			[action in ActionName | "default"]: PolicyDefinition;
		}
	>;
	display_hints?: {};
	human_readable_name?: string;
	summary?: string;
	named_filters?: { [name: string]: SpecialFilter };
	calculated_fields?: {
		[field_name: string]: CalculatedField<any>;
	};
};

/** Creates a collection. All collections are automatically served via
 * the REST API, with permissions set by the Policies */
export default class Collection {
	/** The name of the collection. This is used as the part of it's URL in the REST API */
	name: string;
	/** Stores all the fields in the given collection. Does not store values of those fields.
	 *
	 *  This is a read-only property. If you want to change fields in an existing collection, use {@link Collection.addField}
	 */
	readonly fields: {
		[field_name: string]: Field;
	};
	/** Used while creating a REST API documentation for your app */
	human_readable_name: string | null;
	/** @todo find out what that is */
	summary: string | null;
	/** An arbitrary value that can be use by front-ends to e.g. format forms for given collection in a specific way */
	display_hints: any;
	/** stores {@link Policy | Policies} for some of the possible {@link ActionName | ActionNames}. If no policy is specified for a given action, the policy under the `default` key is used. */
	policy: { [action in ActionName | "default"]?: Policy };
	/** stores the special filtes attached to this collection */
	named_filters: { [name: string]: SpecialFilter };
	/** stores the calculated fields of the collection */
	calculated_fields: {
		[field_name: string]: CalculatedField<any>;
	} = {};

	/** Create a new app. This is not the most elegant way to create a collection, it's better to use {@link Collection.fromDefinition}
	 * @param app the app
	 * @param definition the collection definition
	 * @category Creating a collection
	 */
	constructor(public app: App, public definition: CollectionDefinition) {
		this.name = definition.name;
		this.fields = {};
		this.human_readable_name = definition.human_readable_name || null;
		this.summary = definition.summary || null;
		this.display_hints = definition.display_hints || {};
		this.policy = {
			default: Public,
		};
		this.named_filters = definition.named_filters || {};

		for (let i = 0; i < definition.fields.length; i++) {
			if (definition.fields[i].params) {
				if (typeof definition.fields[i].params !== "object") {
					throw new Errors.ValidationError(
						`In field "${definition.fields[i].name}": "params" is of wrong type, it should be an object`
					);
				}
			}
		}
		this.addFields(this.definition.fields);

		if (this.definition.calculated_fields) {
			for (const calc_field_name in this.definition.calculated_fields) {
				this.addCalculatedField(
					calc_field_name,
					this.definition.calculated_fields[calc_field_name]
				);
			}
		}

		this.setPolicy(
			this.definition.policy || {
				default: Public,
			}
		);
	}

	/** Initialize all the fields
	 * @internal
	 */
	async init() {
		for (const field of Object.values(this.fields)) {
			await field.init(this.app);
		}
	}

	/** Use a "definition object" to describe the shape and behavior of the collection.
	 *
	 * Example:
	 *
	 * ```
	 * import {
	 *   App,
	 *   Collection,
	 *   FieldTypes,
	 *   FieldDefinitionHelper as field,
	 *   Policies,
	 * } from "sealious";
	 *
	 *const app = new App();
	 *
	 *Collection.fromDefinition(
	 *  app,
	 *  {
	 *  name: "seals",
	 *  fields: [
	 *    field("name", FieldTypes.Text),
	 *    field("age", FieldTypes.Int, { min: 0 }),
	 *  ],
	 *  policy: {
	 *    show: Policies.Public,
	 *    delete: Policies.Noone,
	 *  },
	 *});
	 * ```
	 *
	 * @param app  the collection read from definition will be attached to this app
	 * @param definition the definition of the appliaction, containing the fields and policies
	 * @category Creating a collection
	 */
	static fromDefinition(
		app: App,
		definition: CollectionDefinition
	): Collection {
		const ret = new Collection(app, definition);
		app.registerCollection(ret);
		return ret;
	}

	/** Adds a field to collection. It's usually not necessary, because you can add all the necessary fields while creating the collection.
	 * @param field_definition the field definition
	 */
	addField(field_definition: FieldDefinition<any>) {
		const field = Field.fromDefinition(this.app, this, field_definition);
		const field_name = field.name;
		if (!this.fields[field_name]) {
			this.fields[field_name] = field;
		} else {
			throw new Errors.DeveloperError(
				`Duplicate field names: "${field_name}" in collection: "${this.name}"`
			);
		}
	}

	/** Add all fields from the given array
	 * @param field_definitions array of field definitions
	 * @internal
	 */
	addFields(field_definitions: FieldDefinition<any>[]) {
		for (const definition of field_definitions) {
			this.addField(definition);
		}
	}

	/** Add a calculated field to the collection
	 * @param calc_field_name  the name of the field
	 * @param calc_field  the field object
	 * @internal
	 */
	addCalculatedField(
		calc_field_name: string,
		calc_field: CalculatedField<any>
	) {
		this.calculated_fields[calc_field_name] = calc_field;
	}

	/** Add special filters to the collection
	 *  @param named_filters  the filters to add
	 */
	addSpecialFilters(named_filters: { [name: string]: SpecialFilter }) {
		this.named_filters = named_filters;
	}

	/** Check if the user didn't provide values for a field that does not exist in this collection
	 * @param values - the values provided by the user
	 * @internal
	 */
	getUnknownFieldErrors(values: values) {
		const validation_errors: values = {};
		for (const field_name in values) {
			if (this.fields[field_name] === undefined) {
				validation_errors[field_name] = new Errors.ValidationError(
					`Unknown field '${field_name}'`
				);
			}
		}
		return validation_errors;
	}
	/** Check if the user didn't miss any of the required fields
	 * @param values values meant to replace the current ones in a given document
	 * @param assume_delete_value_on_missing_key if set to true, values not provided in `values` are considered to be empty and meant to be deleted if they had a value previously (PUT vs PATCH)
	 * @param old_values the values that the given resource currently has.
	 * @internal
	 */
	async getMissingFieldValuesErrors(
		values: values,
		assume_delete_value_on_missing_key: boolean,
		old_values: values
	) {
		const errors: values = {};

		for (const field of Object.values(this.fields)) {
			if (field.required) {
				if (
					(assume_delete_value_on_missing_key &&
						values[field.name] === undefined) ||
					(old_values[field.name] === undefined &&
						values[field.name] === undefined)
				) {
					errors[field.name] = new Errors.ValidationError(
						`Missing value for field '${field.name}'`
					).toObject();
				}
			}
		}

		return errors;
	}

	/** Check if any of the values provided by the user contain invalid values
	 * @param context the context
	 * @param values the new values provided by the user, meant to replace the old ones
	 * @param old_values the current values of fields in this document, to be replaced
	 * @internal
	 */
	async getInvalidFieldValuesErrors(
		context: Context,
		values: values,
		old_values?: values
	) {
		const errors: { [field_name: string]: ErrorLikeObject } = {};
		const promises = [];
		for (const field_name in values) {
			if (this.fields[field_name]) {
				const value = values[field_name];
				const old_value = old_values
					? old_values[field_name]
					: undefined;
				const promise = this.fields[field_name]
					.isProperValue(context, value, old_value)
					.then((result) => {
						if (!result.valid) {
							errors[field_name] = new Errors.ValidationError(
								result.reason as string
							).toObject();
						}
					});
				promises.push(promise);
			}
		}
		await Promise.all(promises);
		return errors;
	}

	/** Perform various checks on values provided by the user
	 * @param context the context
	 * @param assume_delete_value_on_missing_key if set to true, values not provided in `values` are considered to be empty and meant to be deleted if they had a value previously (PUT vs PATCH)
	 * @param new_values the new values, provided by the user, meant to replace the old ones
	 * @param old_values the current values, meant to soon be replaced
	 * @internal
	 */
	async validateFieldValues(
		context: Context,
		assume_delete_value_on_missing_key: boolean,
		new_values: values,
		old_values?: values
	) {
		const errors_array: {
			[field_name: string]: Errors.ErrorLikeObject;
		}[] = [
			this.getUnknownFieldErrors(new_values),
			this.getMissingFieldValuesErrors(
				new_values,
				assume_delete_value_on_missing_key,
				old_values || {}
			),
			this.getInvalidFieldValuesErrors(context, new_values, old_values),
		];

		const errors = (await Promise.all(errors_array)).reduce((a, b) => {
			return { ...a, ...b };
		}, {});
		if (Object.keys(errors).length > 0) {
			throw new Errors.ValidationError(
				"There are problems with some of the provided values.",
				{ data: errors }
			);
		}
	}

	/** Convert all given field values into a form ready to be stored in the database
	 * @param context the context
	 * @param body all field values provided by the user. Might contain errors, non-existing fields, missing fields
	 * @param old_body current values, meant to be replaced
	 * @internal
	 */
	async encodeFieldValues(context: Context, body: values, old_body?: values) {
		const promises: values = {};
		for (let field_name in this.fields) {
			const field = this.fields[field_name];
			if (
				body[field_name] === undefined &&
				field.hasDefaultValue() &&
				(!old_body || old_body[field_name] === undefined)
			) {
				body[field_name] = await field.getDefaultValue();
			}
		}
		for (const field_name in body) {
			let current_value = body[field_name];
			if (current_value === undefined) {
				current_value = null;
			}
			const old_value = old_body && old_body[field_name];
			promises[field_name] = this.fields[field_name].encode(
				context,
				current_value,
				old_value
			);
		}
		return Bluebird.props(promises);
	}

	/** Return the specification of the collection to be returned when generating the docs for the REST API
	 * @param summary the human-readable description of the collection
	 * @internal;
	 */
	getSpecification(summary: any) {
		// with_validators:boolean - whether to include validator functions in field descriptions. Warning! If set to true, the output is not serializable in JSON.
		const fields_spec: {
			[field: string]: {
				name: string;
				type: string;
				display_hints: any;
				required?: boolean;
			};
		} = {};
		for (const field_name in this.fields) {
			const field_specification = this.fields[
				field_name
			].getSpecification();
			fields_spec[field_name] = {
				...field_specification,
				name: field_name,
			};
			fields_spec[field_name].required = this.fields[field_name].required;
		}

		const specification = {
			name: this.name,
			human_readable_name: this.human_readable_name,
			summary: summary,
			fields: fields_spec,
			display_hints: this.display_hints,
		};

		return specification;
	}

	/** Set a policy for given actions
	 * @param strategy_definition - an object that maps a given {@link ActionName} to a {@link Policy}. Not all action names have to be mapped to a policy. `default` policy can be provided and it will be used when performing an action with an unspecified policy.
	 */
	setPolicy(
		strategy_definition: Partial<
			{
				[action in ActionName | "default"]: PolicyDefinition;
			}
		>
	) {
		if (
			strategy_definition instanceof Policy ||
			strategy_definition instanceof Array
		) {
			this.policy = {
				default: Policy.fromDefinition(
					strategy_definition as PolicyDefinition
				),
			};
		} else if (typeof strategy_definition === "object") {
			for (const action_name in strategy_definition) {
				const policy = (strategy_definition as {
					[action in ActionName]: PolicyDefinition;
				})[action_name as ActionName];
				this.policy[action_name as ActionName] = Policy.fromDefinition(
					policy
				);
			}
		}
	}

	/** Get {@link Policy} for a given {@link ActionName}
	 * @param action_name the action name
	 */
	getPolicy(action_name: ActionName): Policy {
		const ret = this.policy[action_name] || this.policy["default"];
		return ret as Policy;
	}

	/** Whether or not any of the fields have a field that handles Large Data
	 * @internal
	 * @todo probably safe to deprecate
	 */
	hasLargeDataFields() {
		for (const i in this.fields) {
			const field = this.fields[i];
			if (field.handles_large_data) {
				return true;
			}
		}
		return false;
	}

	/** Whether or not any of the fields' behavior depends on the current values of themselves or other fields
	 * @param action_name the action for which to check
	 * @internal
	 */
	isOldValueSensitive(action_name: ActionName) {
		for (const field_name in this.fields) {
			if (this.fields[field_name].isOldValueSensitive(action_name)) {
				return true;
			}
		}
		return false;
	}

	/** Takes values from database and decodes them into something more friendly. Can also be used to change the output format of the data
	 * @param context the context
	 * @param values the values from DB
	 * @param format a format for a subset of all the fields, that will be passed down to each of the fields
	 * @internal
	 */
	decodeValues(context: Context, values: values, format: any = {}) {
		const decoded_values: values = {};
		if (!format) {
			format = {};
		}
		for (const field_name in this.fields) {
			const value = values[field_name];
			const field = this.fields[field_name];
			if (field === undefined) {
				continue;
			}
			const field_format = format[field_name] || null;

			// todo: probably need to fetch the old value here

			decoded_values[field_name] = field.decode(
				context,
				value,
				null,
				field_format
			);
		}
		return Bluebird.props(decoded_values);
	}

	/** Returns the values for all the calculated fields
	 * @param context the context
	 * @param item the item with decoded values
	 * @param raw_db_entry the raw db entry of the item
	 * @param calculate a map that tells whether or not to calculate values for a given calculated field
	 * @internal
	 */
	private _getCalculatedFields(
		context: Context,
		item: Item,
		raw_db_entry: values,
		calculate: boolean | values<boolean>
	) {
		const ret: values<any> = {};
		for (const field_name in this.calculated_fields) {
			if (
				calculate === true ||
				(calculate as values<boolean>)[field_name]
			) {
				ret[field_name] = this.calculated_fields[field_name].calculate(
					context,
					item,
					raw_db_entry
				);
			}
		}
		return Bluebird.props(ret);
	}

	/** Takes a db entry of an item and formats it so it can be presented to the user
	 * @param context the context
	 * @param db_document the raw db entry
	 * @param format the formats for some/all/none of the fields
	 * @param calculate whether or not to compute some/all of the fields
	 */
	async getResourceRepresentation(
		context: Context,
		db_document: any,
		format: any,
		calculate?: boolean | values<boolean>
	): Promise<Item> {
		if (calculate === undefined) calculate = true;
		const representation = await this.decodeValues(
			context,
			db_document,
			format
		);
		representation.id = db_document.sealious_id;
		representation._metadata = db_document._metadata;
		representation._metadata.collection_name = this.name;

		if (calculate) {
			representation.calculated_fields = await this._getCalculatedFields(
				context,
				representation as Item,
				db_document,
				calculate
			);
		}
		return representation as Item;
	}

	/** Throws if a given {@link ActionName} is not allowed to be performed on a given Item under given context
	 * @param context the context
	 * @param action_name the action name
	 * @param item the item (pass `undefined` if checking actions like `create` as then there's no item to check on)
	 */
	async checkIfActionIsAllowed(
		context: Context,
		action_name: ActionName,
		item?: Item
	) {
		const policy = this.getPolicy(action_name);

		const sealious_response = item
			? new SingleItemResponse({
					item,
					attachments: {},
					fieldsWithAttachments: {},
			  })
			: undefined;

		const decision = await policy.check(context, sealious_response);
		if (decision !== null && !decision.allowed) {
			throw new Errors.InvalidCredentials(decision.reason);
		}
	}

	/** Gets the aggregation stages that filter the resources based on Policies, filters,  search params and named filters. Returns a mongo pipeline. This is done in order to avoid having to manually check each item returned from the database
	 * @param context the context
	 * @param action_name the {@link ActionName}
	 * @param query_params query params - e.g. parsed from a REST GET request
	 * @param query_params.search the search string
	 * @param query_params.filter the filter object that can contain filter values for any of the fields in the collection
	 * @param ids - deprecated
	 * @param named_filters names of any named filters that should be applied to the query
	 * @todo check if removing the `ids` arg breaks anything
	 */
	async getAggregationStages(
		context: Context,
		action_name: ActionName,
		query_params: { search?: {}; filter?: {} },
		ids: string[] = [],
		named_filters: string[] = []
	): Promise<QueryStage[]> {
		const fields = this.fields;
		const policy = this.getPolicy(action_name);
		const ret: QueryStage[] = [];

		if (query_params.search) {
			ret.push({
				$match: {
					$text: {
						$search: query_params.search.toString(),
						$caseSensitive: false,
						$diacriticSensitive: false,
					},
				},
			});
		}

		ret.push(
			...(await policy
				.getRestrictingQuery(context)
				.then((query) => query.toPipeline()))
		);
		ret.push(
			...(await Promise.all(
				Object.keys(fields).map((field_name) => {
					return fields[field_name].getAggregationStages(
						context,
						query_params
					);
				})
			).then((array) =>
				array
					.sort((a, _) => {
						return Object.keys(a[0] || {})[0] === "$match" ? -1 : 1;
					})
					.reduce((acc, e) => acc.concat(e), [])
			))
		);
		if (ids.length === 0) {
			Query.fromSingleMatch({
				sealious_id: { $in: ids },
			}).toPipeline();
		}

		for (const filter_name of named_filters) {
			const filter_pipeline = (
				await this.named_filters[filter_name].getFilteringQuery()
			).toPipeline();
			ret.push(...filter_pipeline);
		}

		return ret;
	}

	/** Return a named filter from the collection
	 * @param filter_name the name of the filter
	 */
	getNamedFilter(filter_name: string) {
		return this.named_filters[filter_name];
	}
}
