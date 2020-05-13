import Collection from "./collection.js";
import Context from "../context.js";
import { ActionName } from "../action.js";
import { ChipTypeName } from "../app/chip-manager.js";
import { App } from "../main.js";
import QueryStage from "../datastore/query-stage.js";
import Query from "../datastore/query.js";

export type FieldDefinition = {
	name: string;
	required: boolean;
	type: string;
	params: any;
	display_hints?: any;
};

export type FieldClass = new (declaration: FieldDefinition) => Field<
	any,
	any,
	any,
	any,
	any
>;

type ValidationResult = {
	valid: boolean;
	reason?: string;
};

export default abstract class Field<
	ParamsType extends { [s: string]: any } = {},
	InputType = any,
	OutputType = InputType,
	StorageType = OutputType,
	FormatParams = any
> {
	name: string;
	declaration: FieldDefinition;
	required: boolean;
	params: ParamsType;
	display_hints: any;
	handles_large_data: false;
	type_name: ChipTypeName = "field_type";
	collection: Collection;

	constructor(declaration: FieldDefinition, collection: Collection) {
		this.name = declaration.name;
		this.declaration = declaration;
		this.required = declaration.required || false;
		this.params = declaration.params || {};
		this.display_hints = declaration.display_hints || {};
		this.collection = collection;
	}

	static fromDefinition(app: App, definition: FieldDefinition) {
		const type = app.ChipManager.getFieldType(definition.type);
		return new type(definition);
	}

	getSpecification() {
		return {
			name: this.name,
			type: this.getTypeName(),
			display_hints: this.display_hints,
			// we need to ensure that there are no circular, unjson-able structures, so all references to `Collection` are replaced by the collection name instead;
			params: Object.keys(this.params)
				.map((key) => {
					const value = this.params[key];
					return [
						key,
						value instanceof Collection ? value.name : value,
					];
				})
				.reduce(
					(acc: { [key: string]: any }, [key, value]) =>
						(acc[key] = value),
					{}
				),
		};
	}

	hasIndex() {
		return false;
	}

	async getAggregationStages(
		context: Context,
		query_params: { filter?: { [field_name: string]: any } }
	) {
		if (!query_params || !query_params.filter) return [];
		let field_filter = query_params.filter[this.name];
		if (
			field_filter &&
			field_filter.length === 1 &&
			field_filter[0] instanceof Array
		) {
			field_filter = field_filter[0]; // to fix an edge case where instead of array of values the array is wrapped within another array
		}
		if (!(this.name in query_params.filter)) {
			return [];
		}
		if (this.name in query_params.filter && field_filter === undefined)
			return [
				{ $match: { [await this.getValuePath()]: { $exists: false } } },
			];
		let new_filter = null;
		if (field_filter instanceof Array) {
			new_filter = await Promise.all(
				field_filter.map((element) => this.encode(context, element))
			).then((filters) => {
				return { $in: filters };
			});
		} else {
			new_filter = await this.filterToQuery(context, field_filter);
		}
		return [
			{ $match: { [await this.getValuePath()]: new_filter } },
		] as QueryStage[];
	}

	async getValuePath(): Promise<string> {
		return this.name;
	}

	abstract getTypeName(): string;

	abstract isProperValue(
		context: Context,
		new_value: InputType,
		old_value: InputType
	): Promise<ValidationResult>;

	async format(
		_: Context,
		value: OutputType,
		__: FormatParams
	): Promise<OutputType> {
		return value;
	}

	async encode(
		_: Context,
		value: InputType,
		__?: InputType
	): Promise<StorageType> {
		return (value as any) as StorageType;
	}

	async decode(_: Context, storage_value: StorageType): Promise<OutputType> {
		return (storage_value as unknown) as OutputType;
	}

	async filterToQuery(context: Context, filter: any): Promise<any> {
		return this.encode(context, filter);
	}
	async fullTextSearchEnabled(): Promise<boolean> {
		return false;
	}
	hasDefaultValue = () => true;
	getDefaultValue(): OutputType | null {
		return null;
	}
	isOldValueSensitive(_: ActionName) {
		return false;
	}

	static valid(): ValidationResult {
		return { valid: true };
	}

	static invalid(reason: string): ValidationResult {
		return { valid: false, reason };
	}

	async init(_: App): Promise<void> {}
}

module.exports = Field;
