import Collection from "./collection";
import Context from "../context";
import { ActionName } from "../action";
import { App } from "../main";
import QueryStage from "../datastore/query-stage";
import AttachmentLoader from "../subject/attachments/attachment-loader";
import ReferenceToCollection from "../subject/attachments/reference-to-collection";

export type Depromisify<T> = T extends Promise<infer V> ? V : T;

export type ExtractParams<F extends Field> = Parameters<F["setParams"]>[0];

export type ExtractInput<F extends Field> = Parameters<F["encode"]>[1];

export type ExtractOutput<F extends Field> = Depromisify<
	ReturnType<F["decode"]>
>;

export type ExtractStorage<F extends Field<any>> = Depromisify<
	ReturnType<F["encode"]>
>;

export type ExtractFormatParams<F> = F extends Field<any, infer T> ? T : never;

export type FieldDefinition<ParamsType> = {
	name: string;
	required?: boolean;
	type: FieldClass;
	params?: ParamsType;
	display_hints?: any;
};

export type FieldClass<T extends Field = Field> = new (
	app: App,
	collection: Collection,
	name: string,
	required: boolean,
	display_hints: any
) => T;

type ValidationResult = {
	valid: boolean;
	reason?: string;
};

export function FieldDefinitionHelper<T extends FieldClass>(
	name: string,
	type: T,
	params: Parameters<InstanceType<T>["setParams"]>[0] = {},
	required: boolean = false
): FieldDefinition<Parameters<InstanceType<T>["setParams"]>[0]> {
	return { name, type, params, required };
}

export default abstract class Field<
	InputType = any,
	OutputType = InputType,
	FormatParams = any
> {
	name: string;
	app: App;
	display_hints: any;
	handles_large_data: boolean = false;
	collection: Collection;
	required: boolean;

	constructor(
		app: App,
		collection: Collection,
		name: string,
		required: boolean,
		display_hints: any
	) {
		this.app = app;
		this.name = name;
		this.display_hints = display_hints || {};
		this.collection = collection;
		this.required = required;
	}

	static fromDefinition<T extends FieldClass>(
		app: App,
		collection: Collection,
		definition: {
			name: string;
			required?: boolean;
			display_hints?: any;
			type: T;
			params?: Parameters<InstanceType<FieldClass>["setParams"]>[0];
		}
	) {
		const type = definition.type;
		const ret = new type(
			app,
			collection,
			definition.name,
			definition.required || false,
			definition.display_hints
		);
		ret.setParams(definition.params || {});
		return ret;
	}

	setParams(_: any): void {}

	getSpecification() {
		return {
			name: this.name,
			type: this.getTypeName(),
			display_hints: this.display_hints,
		};
	}

	hasIndex():
		| boolean
		| "text"
		| { [subfield_name: string]: boolean | "text" } {
		return false;
	}

	async getAggregationStages(
		context: Context,
		query_params: { filter?: { [field_name: string]: any } }
	): Promise<QueryStage[]> {
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
		if (this.name in query_params.filter && field_filter === undefined) {
			const ret = [
				{
					$match: { [await this.getValuePath()]: { $exists: false } },
				} as QueryStage,
			];

			return ret;
		}

		let new_filter = null;
		if (field_filter instanceof Array) {
			new_filter = await Promise.all(
				field_filter.map((element) => this.encode(context, element))
			).then((filters) => {
				const ret = { $in: filters };
				return ret;
			});
		} else {
			new_filter = await this.filterToQuery(context, field_filter);
		}
		const ret = [
			{ $match: { [await this.getValuePath()]: new_filter } },
		] as QueryStage[];
		return ret;
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

	format: never;
	filter_to_query: never;

	async encode(
		_: Context,
		value: InputType | null,
		__?: InputType
	): Promise<any> {
		return value as any;
	}

	async decode(
		_: Context,
		storage_value: Depromisify<ReturnType<this["encode"]>>,
		__: OutputType,
		___: FormatParams
	): Promise<OutputType | null> {
		return (storage_value as unknown) as OutputType;
	}

	async filterToQuery(context: Context, filter: any): Promise<any> {
		return this.encode(context, filter);
	}
	async fullTextSearchEnabled(): Promise<boolean> {
		return false;
	}

	hasDefaultValue = () => true;

	getDefaultValue(): Depromisify<ReturnType<this["decode"]>> | null {
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

	getAttachmentLoader(
		context: Context,
		omit_it: Boolean,
		attachment_params: ConstructorParameters<
			typeof ReferenceToCollection
		>[2]
	): AttachmentLoader | null {
		return null;
	}
}

export { default as HybridField } from "./field-hybrid";
export * from "./field-hybrid";
