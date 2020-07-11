import Bluebird from "bluebird";

import * as Errors from "../response/errors";
import Field from "./field";
import CalculatedField from "./calculated-field";
import AccessStrategy, { AccessStrategyDefinition } from "./access-strategy";

import SingleItemResponse from "../../common_lib/response/single-item-response";
import App from "../app/app";
import { ActionName } from "../action";
import Context from "../context";

type values<T = any> = { [field_name: string]: T };

import { FieldDefinition } from "./field";
import Item from "../../common_lib/response/item";
import Query, { QueryStage } from "../datastore/query";
import SpecialFilter from "./special-filter";
import Public from "../app/access-strategy-types/public";
import { ErrorLikeObject } from "../response/errors";

export type CollectionDefinition = {
	name: string;
	fields: FieldDefinition<any>[];
	access_strategy?: Partial<
		{
			[action in ActionName | "default"]: AccessStrategyDefinition;
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

export default class Collection {
	name: string;
	fields: {
		[field_name: string]: Field;
	};
	human_readable_name: string | null;
	summary: string | null;
	display_hints: any;
	access_strategy: { [action in ActionName | "default"]?: AccessStrategy };
	named_filters: { [name: string]: SpecialFilter };
	calculated_fields: {
		[field_name: string]: CalculatedField<any>;
	} = {};

	constructor(public app: App, public definition: CollectionDefinition) {
		this.name = definition.name;
		this.fields = {};
		this.human_readable_name = definition.human_readable_name || null;
		this.summary = definition.summary || null;
		this.display_hints = definition.display_hints || {};
		this.access_strategy = {
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

		this.setAccessStrategy(
			this.definition.access_strategy || {
				default: Public,
			}
		);
	}

	async init() {
		for (const field of Object.values(this.fields)) {
			await field.init(this.app);
		}
	}

	static fromDefinition(
		app: App,
		definition: CollectionDefinition
	): Collection {
		const ret = new Collection(app, definition);
		app.registerCollection(ret);
		return ret;
	}

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

	addFields(field_definitions: FieldDefinition<any>[]) {
		for (const definition of field_definitions) {
			this.addField(definition);
		}
	}

	addCalculatedField(
		calc_field_name: string,
		calc_field: CalculatedField<any>
	) {
		this.calculated_fields[calc_field_name] = calc_field;
	}
	addSpecialFilters(named_filters: { [name: string]: SpecialFilter }) {
		this.named_filters = named_filters;
	}
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

	setAccessStrategy(
		strategy_definition: Partial<
			{
				[action in ActionName | "default"]: AccessStrategyDefinition;
			}
		>
	) {
		if (
			strategy_definition instanceof AccessStrategy ||
			strategy_definition instanceof Array
		) {
			this.access_strategy = {
				default: AccessStrategy.fromDefinition(
					strategy_definition as AccessStrategyDefinition
				),
			};
		} else if (typeof strategy_definition === "object") {
			for (const action_name in strategy_definition) {
				const access_strategy = (strategy_definition as {
					[action in ActionName]: AccessStrategyDefinition;
				})[action_name as ActionName];
				this.access_strategy[
					action_name as ActionName
				] = AccessStrategy.fromDefinition(access_strategy);
			}
		}
	}
	getAccessStrategy(action_name: ActionName): AccessStrategy {
		const ret =
			this.access_strategy[action_name] ||
			this.access_strategy["default"];
		return ret as AccessStrategy;
	}
	hasLargeDataFields() {
		for (const i in this.fields) {
			const field = this.fields[i];
			if (field.handles_large_data) {
				return true;
			}
		}
		return false;
	}
	isOldValueSensitive(action_name: ActionName) {
		for (const field_name in this.fields) {
			if (this.fields[field_name].isOldValueSensitive(action_name)) {
				return true;
			}
		}
		return false;
	}
	decodeValues(context: Context, values: values, format: any) {
		const decoded_values: values = {};
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
	async _getBody(context: Context, db_document: {}, format: any) {
		return this.decodeValues(context, db_document, format || {});
	}
	_getCalculatedFields(
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

	async getResourceRepresentation(
		context: Context,
		db_document: any,
		format: any,
		calculate?: boolean | values<boolean>
	): Promise<Item> {
		if (calculate === undefined) calculate = true;
		const representation = await this._getBody(
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

	async checkIfActionIsAllowed(
		context: Context,
		action_name: ActionName,
		item?: Item
	) {
		const access_strategy = this.getAccessStrategy(action_name);

		const sealious_response = item
			? new SingleItemResponse({
					item,
					attachments: {},
					fieldsWithAttachments: {},
			  })
			: undefined;

		const decision = await access_strategy.check(
			context,
			sealious_response
		);
		if (decision !== null && !decision.allowed) {
			throw new Errors.InvalidCredentials(decision.reason);
		}
	}

	async getAggregationStages(
		context: Context,
		action_name: ActionName,
		query_params: { search?: {}; filter?: {} },
		ids: string[] = [],
		named_filters: string[] = []
	): Promise<QueryStage[]> {
		const fields = this.fields;
		const access_strategy = this.getAccessStrategy(action_name);
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
			...(await access_strategy
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

	getNamedFilter(filter_name: string) {
		return this.named_filters[filter_name];
	}
}
