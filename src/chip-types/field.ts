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

/** A function that helps to define a field for a collection. Performs type-checking to ensure that the parameters match the expected format.
 *
 *  **This is the recommended way to define a field**
 *
 *  @category Defining a field in a collection
 */
export function FieldDefinitionHelper<T extends FieldClass>(
	name: string,
	type: T,
	params: Parameters<InstanceType<T>["setParams"]>[0] = {},
	required: boolean = false
): FieldDefinition<Parameters<InstanceType<T>["setParams"]>[0]> {
	return { name, type, params, required };
}

/** The field class itself. Stores information on the field name, and methods that decide waht values are valid and how they are stored. The {@link Field} class describes a type of field in general (like "Text" and "Number"), and a {@link Field} instance describes one particular field in a collection (like "name" and "age").
 *
 *  Extend this class to create fields with custom behavior.
 *
 *  **The recommended way to create a field for a collection is {@link FieldDefinitionHelper}, as it performs  type checking of the field params.**
 *
 * Some of the most useful field types include:
 * * {@link Boolean}
 * * {@link DateField | Date}
 * * {@link Datetime}
 * * {@link Email}
 * * {@link Enum}
 * * {@link FileField | Field}
 * * {@link Float}
 * * {@link Html}
 * * {@link Image}
 * * {@link Int}
 * * {@link SingleReference}
 * * {@link Text}
 */
export default abstract class Field<
	InputType = any,
	OutputType = InputType,
	FormatParams = any
> {
	/** the name of the field */
	name: string;
	/** the app that the field exists in
	 *  @internal
	 */
	app: App;
	/** The display hints specified for this field */
	display_hints: any;
	/** Whether or not the field handles large data
	 * @todo: see if there's any viability in storing this
	 */
	handles_large_data: boolean = false;
	/** The collection this field is attached to */
	collection: Collection;
	/** Whether or not this field should always have a value. Creating a resource with a value missing for a required field will throw an error */
	required: boolean;

	/** Creates a new instance of a field */
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

	/** Create a new instance of {@link Field} based on the definition. **It's recommended to use {@link FieldDefinitionHelper} instead */
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

	/** This method is used to set and process the params upon the field's creation when the app starts up. The type of argument of this method determines type checking that's performed by @{link FieldDefinitionHelper}. */
	setParams(_: any): void {}

	/** Return a summary of this field */
	getSpecification() {
		return {
			name: this.name,
			type: this.getTypeName(),
			display_hints: this.display_hints,
		};
	}

	/** Whether or not this field should have a dedicated index in the database */
	hasIndex():
		| boolean
		| "text"
		| { [subfield_name: string]: boolean | "text" } {
		return false;
	}

	/** Creates parts of a Mongo Pipieline that will be used to filter the items when listing items of a collection */
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

	/** Value path is where inside a single record should the DB look for the field's value when filtering resources. Some fields use complex objects for storage and overwrite this method, and thanks to that they don't have to reimplement {@link Field.getAggregationStages} */
	async getValuePath(): Promise<string> {
		return this.name;
	}

	abstract getTypeName(): string;

	abstract isProperValue(
		context: Context,
		new_value: InputType,
		old_value: InputType
	): Promise<ValidationResult>;

	/** Decides how to store the given value in the database, based on the context and previous value of the field */
	async encode(
		_: Context,
		value: InputType | null,
		__?: InputType
	): Promise<any> {
		return value as any;
	}

	/** Reverse to the {@link Field.encode} function. Takes what's inside the database and returns the value in a given format */
	async decode(
		_: Context,
		storage_value: Depromisify<ReturnType<this["encode"]>>,
		__: OutputType,
		___: FormatParams
	): Promise<OutputType | null> {
		return (storage_value as unknown) as OutputType;
	}

	/** Generates a mongo query based on the filter value */
	async filterToQuery(context: Context, filter: any): Promise<any> {
		return this.encode(context, filter);
	}

	/** Whether or not the db should create a fulltext index on this field */
	async fullTextSearchEnabled(): Promise<boolean> {
		return false;
	}

	/** Whether or not a field has a default value - that is, a value given to the field if no value is provided */
	hasDefaultValue = () => true;

	/** The default value that will be assigned to the field if no value is given */
	getDefaultValue(): Depromisify<ReturnType<this["decode"]>> | null {
		return null;
	}

	/** Whether or not any of the methods of the field depend on the previous value of the field */
	isOldValueSensitive(_: ActionName) {
		return false;
	}

	/** Used to signal a positive decision from within {@link Field.isProperValue}. */
	static valid(): ValidationResult {
		return { valid: true };
	}

	/** Used to signal a negative decition from within {@link Field.isProperValue}. */
	static invalid(reason: string): ValidationResult {
		return { valid: false, reason };
	}

	/** Runs when the app is being started. Hooks can be set up within this function */
	async init(_: App): Promise<void> {}

	/** If the field supports attachments, it should return a properly configured {@link AttachmentLoader}. Not necessary for most basic fields. */
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
