import clone from "clone";
import Bluebird from "bluebird";

import * as Errors from "../response/errors.js";
import Chip from "./chip.js";
import Field, { FieldClass } from "./field.js";
import CalculatedField from "./calculated-field.js";
import AccessStrategy, {
	AccessStrategyDeclaration,
} from "./access-strategy.js";

import SingleItemResponse from "../../common_lib/response/single-item-response.js";
import App from "../app/app.js";
import { ActionName } from "../action.js";
import Context from "../context.js";

type values<T = any> = { [field_name: string]: T };

import { FieldDefinition } from "./field";
import Item from "../../common_lib/response/item.js";
import Query from "../datastore/query.js";
import { ChipTypeName } from "../app/chip-manager.js";
import SpecialFilter from "./special-filter.js";

export type CollectionDefinition = {
	name: string;
	fields: FieldDefinition[];
	access_strategy: {
		[action in ActionName | "deafult"]: AccessStrategyDeclaration;
	};
	display_hints?: {};
	human_readable_name?: string;
	summary?: string;
	named_filters?: { [name: string]: SpecialFilter };
	calculated_fields?: {
		[field_name: string]: [string, any];
	};
};

export default class Collection extends Chip {
	type_name: ChipTypeName = "collection";
	name: string;
	app: App;
	fields: {
		[field_name: string]: Field<any, any, any, any>;
	};
	human_readable_name: string | null;
	summary: string | null;
	display_hints: any;
	access_strategy: { [action in ActionName | "default"]?: AccessStrategy };
	named_filters: { [name: string]: SpecialFilter };
	calculated_fields: {
		[field_name: string]: CalculatedField;
	} = {};

	constructor(app: App, declaration: CollectionDefinition) {
		super();
		this.app = app;
		this.name = declaration.name;
		this.fields = {};
		this.human_readable_name = declaration.human_readable_name || null;
		this.summary = declaration.summary || null;
		this.display_hints = declaration.display_hints || {};
		this.access_strategy = {
			default: AccessStrategy.fromDefinition(app, "public"),
		};
		this.named_filters = declaration.named_filters || {};

		for (let i = 0; i < declaration.fields.length; i++) {
			if (declaration.fields[i].params) {
				if (typeof declaration.fields[i].params !== "object") {
					throw new Errors.ValidationError(
						`In field "${declaration.fields[i].name}": "params" is of wrong type, it should be an object`
					);
				}
			}
		}
		this.addFields(declaration.fields);

		if (declaration.calculated_fields) {
			for (const calc_field_name in declaration.calculated_fields) {
				const calc_field_type_declaration =
					declaration.calculated_fields[calc_field_name][0];
				const calc_field_type_params =
					declaration.calculated_fields[calc_field_name][1];
				this.addCalculatedField(
					calc_field_name,
					calc_field_type_declaration,
					calc_field_type_params
				);
			}
		}

		this.setAccessStrategy(declaration.access_strategy);
	}

	static fromDefinition(
		app: App,
		definition: CollectionDefinition
	): Collection {
		return new Collection(app, definition);
	}

	addField(field_declaration: FieldDefinition) {
		const FieldType = this.app.ChipManager.getFieldType(
			field_declaration.type
		) as FieldClass;
		const field = new FieldType(field_declaration);
		const field_name = field.name;
		if (!this.fields[field_name]) {
			this.fields[field_name] = field;
		} else {
			throw new Errors.DeveloperError(
				`Duplicate field names: "${field_name}" in collection: "${this.name}"`
			);
		}
	}

	addFields(field_declarations: FieldDefinition[]) {
		for (const declaration of field_declarations) {
			this.addField(declaration);
		}
	}

	addCalculatedField(
		calc_field_name: string,
		calc_field_type_declaration: string,
		calc_field_type_params: any
	) {
		this.calculated_fields[calc_field_name] = new CalculatedField(
			this.app,
			calc_field_name,
			calc_field_type_declaration,
			calc_field_type_params
		);
	}
	addSpecialFilters(named_filters: { [name: string]: SpecialFilter }) {
		this.named_filters = named_filters;
	}
	getUnknownFieldErrors(field_type_name: string, values: values) {
		const validation_errors: values = {};
		for (const field_name in values) {
			if (this.fields[field_name] === undefined) {
				validation_errors[field_name] = new Errors.ValidationError(
					`Unknown field '${field_name}' for field-type '${field_type_name}'`
				);
			}
		}
		return validation_errors;
	}

	getMissingValuesChecker(
		values: values,
		assume_delete_value_on_missing_key: boolean,
		old_values: values
	) {
		if (assume_delete_value_on_missing_key) {
			return (field_name: string) =>
				this.fields[field_name].required &&
				values[field_name] === undefined;
		} else {
			return (field_name: string) =>
				this.fields[field_name].required &&
				values[field_name] === undefined &&
				old_values[field_name] === undefined;
		}
	}

	async getMissingFieldValuesErrors(
		values: values,
		assume_delete_value_on_missing_key: boolean,
		old_values: values
	) {
		const errors: values = {};
		const checker_fn = this.getMissingValuesChecker(
			values,
			assume_delete_value_on_missing_key,
			old_values
		);

		await Bluebird.filter(Object.keys(this.fields), checker_fn).each(
			function (field_name) {
				errors[field_name] = new Errors.ValidationError(
					`Missing value for field '${field_name}'`
				);
			}
		);
		return errors;
	}
	async getInvalidFieldValuesErrors(
		context: Context,
		values: values,
		old_values: values
	) {
		const errors: { [field_name: string]: Error } = {};
		const promises = [];
		for (const field_name in values) {
			if (this.fields[field_name]) {
				const value = values[field_name];
				if (value === "") continue;
				const old_value = old_values
					? old_values[field_name]
					: undefined;
				const promise = this.fields[field_name]
					.isProperValue(context, value, old_value)
					.catch(function (error) {
						if (
							typeof error === "string" ||
							error.type === "validation"
						) {
							errors[field_name] = new Errors.ValidationError(
								error
							);
						} else {
							throw error;
						}
					});
				promises.push(promise);
			}
		}
		await Promise.all(promises);
		return errors;
	}
	getMissingRequiredFieldValues(new_values: values) {
		const errors: { [field_name: string]: Error } = {};
		for (const field_name in new_values) {
			if (
				this.fields[field_name] &&
				this.fields[field_name].required &&
				new_values[field_name] === ""
			) {
				errors[field_name] = new Errors.ValidationError(
					`Missing value for required field: '${field_name}'`
				);
			}
		}
		return errors;
	}
	async validateFieldValues(
		context: Context,
		field_type_name: string,
		assume_delete_value_on_missing_key: boolean,
		new_values: values,
		old_values: values
	) {
		const errors_array = [
			this.getMissingRequiredFieldValues(new_values),
			this.getUnknownFieldErrors(field_type_name, new_values),
			this.getMissingFieldValuesErrors(
				new_values,
				assume_delete_value_on_missing_key,
				old_values
			),
			this.getInvalidFieldValuesErrors(context, new_values, old_values),
		];

		const errors = (await Promise.all(errors_array)).reduce((a, b) => {
			return { ...a, ...b };
		}, {});
		const user_errors: values = {};
		const non_user_errors: values = {};
		for (const field_name in errors) {
			const error = errors[field_name];
			if (error.is_user_fault) {
				user_errors[field_name] = error;
			} else {
				non_user_errors[field_name] = error;
			}
		}
		const non_user_errors_amount = Object.keys(non_user_errors).length;
		if (non_user_errors_amount > 0) {
			throw non_user_errors[Object.keys(non_user_errors)[0]];
		}
		const user_errors_amount = Object.keys(user_errors).length;
		if (user_errors_amount > 0) {
			throw new Errors.ValidationError(
				"There are problems with some of the provided values.",
				user_errors
			);
		}
	}
	async encodeFieldValues(context: Context, body: values, old_body: values) {
		const promises: values = {};
		for (let field_name in this.fields) {
			const field = this.fields[field_name];
			if (
				!body[field_name] &&
				field.hasDefaultValue() &&
				(!old_body || old_body[field_name] === undefined)
			) {
				body[field_name] = await field.getDefaultValue();
			}
		}
		for (const field_name in body) {
			const current_value = body[field_name];
			if (current_value === undefined || current_value === "") {
				promises[field_name] = "";
			} else {
				const old_value = old_body && old_body[field_name];
				promises[field_name] = this.fields[field_name].encode(
					context,
					current_value,
					old_value
				);
			}
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
				params: any;
				required?: boolean;
			};
		} = {};
		for (const field_name in this.fields) {
			const field_specification = this.fields[
				field_name
			].getSpecification();
			fields_spec[field_name] = field_specification;
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
		strategy_declaration:
			| AccessStrategyDeclaration
			| { [action in ActionName]: AccessStrategyDeclaration }
	) {
		if (
			typeof strategy_declaration === "string" ||
			strategy_declaration instanceof AccessStrategyType ||
			strategy_declaration instanceof Array
		) {
			this.access_strategy = {
				default: new AccessStrategy(
					this.app,
					strategy_declaration as AccessStrategyDeclaration
				),
			};
		} else if (typeof strategy_declaration === "object") {
			for (const action_name in strategy_declaration) {
				const access_strategy = (strategy_declaration as {
					[action in ActionName]: AccessStrategyDeclaration;
				})[action_name as ActionName];
				this.access_strategy[
					action_name as ActionName
				] = new AccessStrategy(this.app, access_strategy);
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
	decodeValues(context: Context, values: values) {
		const decoded_values: values = {};
		for (const key in this.fields) {
			const value = values[key];
			const field = this.fields[key];
			if (field === undefined) {
				continue;
			}
			decoded_values[key] = field.decode(context, value);
		}
		return Bluebird.props(decoded_values);
	}
	formatDecodedValues(context: Context, decoded_values: values, format: any) {
		const formatted_values = clone(decoded_values);
		for (const field_name in formatted_values) {
			const field_format = format[field_name] || undefined;
			const decoded_value = decoded_values[field_name];
			formatted_values[field_name] = this.fields[field_name].format(
				context,
				decoded_value,
				field_format
			);
		}
		return Bluebird.props(formatted_values);
	}
	async _getBody(context: Context, db_document: {}, format: any) {
		const decoded_values = await this.decodeValues(context, db_document);
		return this.formatDecodedValues(context, decoded_values, format || {});
	}
	_getCalculatedFields(
		context: Context,
		item: values,
		raw_db_entry: values,
		calculate: boolean | values<boolean>
	) {
		const ret: values<any> = {};
		for (const field_name in this.calculated_fields) {
			if (
				calculate === true ||
				(calculate as values<boolean>)[field_name]
			) {
				ret[field_name] = this.calculated_fields[field_name].get_value(
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
	) {
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
				representation,
				db_document,
				calculate
			);
		}
		return representation;
	}

	checkIfActionIsAllowed(
		context: Context,
		action_name: ActionName,
		item: Item
	) {
		const access_strategy = this.getAccessStrategy(action_name);

		const sealious_response = item
			? new SingleItemResponse({
					item,
					attachments: {},
					fieldsWithAttachments: {},
			  })
			: undefined;

		return access_strategy.check(context, sealious_response);
	}

	async getAggregationStages(
		context: Context,
		action_name: ActionName,
		query_params: { search?: {}; filter?: {} },
		ids: []
	) {
		const fields = this.fields;
		const access_strategy = this.getAccessStrategy(action_name);

		return Bluebird.all([
			query_params.search
				? [
						{
							$match: {
								$text: {
									$search: query_params.search.toString(),
									$caseSensitive: false,
									$diacriticSensitive: false,
								},
							},
						},
				  ]
				: [],
			access_strategy
				.getRestrictingQuery(context)
				.then((query) => query.toPipeline()),
			Promise.all(
				Object.keys(fields).map((field_name) =>
					fields[field_name].getAggregationStages(
						context,
						query_params
					)
				)
			).then((array) =>
				array.sort((a, _) => {
					return Object.keys(a[0] || {})[0] === "$match" ? -1 : 1;
				})
			),
			Promise.resolve(
				ids.length === 0
					? []
					: Query.fromSingleMatch({
							sealious_id: { $in: ids },
					  }).toPipeline()
			),
		])
			.map(Promise.all)
			.reduce((a, b) => a.concat(b), [] as any[])
			.reduce((a, b) => a.concat(b), [] as any[]);
	}

	getNamedFilter(filter_name: string) {
		return this.named_filters[filter_name];
	}
}
