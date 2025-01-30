import type Collection from "./collection.js";
import type Context from "../context.js";
import type { ActionName } from "../action.js";
import type QueryStage from "../datastore/query-stage.js";
import type { MatchBody } from "../datastore/query-stage.js";
import { BadSubjectAction } from "../response/errors.js";
import isEmpty from "../utils/is-empty.js";
import type { App } from "../app/app.js";
import { ItemListResult } from "./item-list-result.js";

export type Depromisify<T> = T extends Promise<infer V> ? V : T;

export type ExtractParams<F extends Field<any, any, any>> = Parameters<
	F["setParams"]
>[0];

export type ExtractFilterParams<F extends Field<any, any, any>> = Parameters<
	F["getMatchQueryValue"]
>[1];

export type ValidationResult = {
	valid: boolean;
	reason?: string;
};

export type ExtractFieldDecoded<F extends Field<any, any, any>> =
	F extends Field<infer T, any, any> ? T : never;

export type ExtractFieldInput<F extends Field<any, any, any>> = F extends Field<
	any,
	infer T,
	any
>
	? T
	: never;

export type ExtractFieldStorage<F extends Field<any, any, any>> =
	F extends Field<any, any, infer T> ? T : never;

export type RequiredField<DecodedType, InputType, StorageType> = Field<
	DecodedType,
	InputType,
	StorageType
> & { required: true };

/** The field class itself. Stores information on the field name, and
 * methods that decide waht values are valid and how they are
 * stored. The {@link Field} class describes a type of field in
 * general (like "Text" and "Number"), and a {@link Field} instance
 * describes one particular field in a collection (like "name" and
 * "age").
 *
 *  Extend this class to create fields with custom behavior.
 *
 * **The recommended way to create a field for a collection is {@link
 *    FieldDefinitionHelper}, as it performs type checking of the
 *    field params.**
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

export abstract class Field<
	DecodedType,
	InputType = DecodedType,
	StorageType = DecodedType
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
	handles_large_data = false;
	/** The collection this field is attached to */
	collection: Collection;
	/** Whether or not this field should always have a value. Creating
	 * a resource with a value missing for a required field will throw
	 * an error */
	required: boolean;

	/** Sets the collection @internal  */
	setCollection(collection: Collection) {
		this.collection = collection;
	}

	setRequired(
		required: boolean
	): RequiredField<DecodedType, InputType, StorageType> {
		this.required = required;
		return this as RequiredField<DecodedType, InputType, StorageType>;
	}

	/** Sets the name @internal */
	setName(name: string) {
		this.name = name;
	}

	/** This method is used to set and process the params upon the
	 * field's creation when the app starts up. The type of argument
	 * of this method determines type checking that's performed by
	 * @{link FieldDefinitionHelper}. */
	setParams(_: any): void {}

	/** Return a summary of this field */
	getSpecification() {
		return {
			name: this.name,
			type: this.typeName,
			display_hints: this.display_hints,
		};
	}

	/** Whether or not this field should have a dedicated index in the
	 * database */
	async hasIndex(): Promise<
		boolean | "text" | { [subfield_name: string]: boolean | "text" }
	> {
		return false;
	}

	/** Value path is where inside a single record should the DB look
	 * for the field's value when filtering resources. Some fields use
	 * complex objects for storage and overwrite this method, and
	 * thanks to that they don't have to reimplement {@link
	 * Field.getAggregationStages} */
	async getValuePath(): Promise<string> {
		return this.name;
	}

	abstract typeName: string;

	protected abstract isProperValue(
		context: Context,
		new_value: unknown,
		old_value: unknown,
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult>;

	public async checkValue(
		context: Context,
		new_value: unknown,
		old_value: unknown,
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (isEmpty(new_value) && this.required) {
			return Field.invalid(`Missing value for field '${this.name}'.`);
		} else if (isEmpty(new_value)) {
			return Field.valid();
		} else {
			return this.isProperValue(
				context,
				new_value,
				old_value,
				new_value_blessing_token
			);
		}
	}

	/** Decides how to store the given value in the database, based on
	 * the context and previous value of the field */
	async encode(
		_: Context,
		value: InputType | null,
		__?: any
	): Promise<StorageType | null> {
		return value as any;
	}

	/** Reverse to the {@link Field.encode} function. Takes what's inside the database and returns the value in a given format */
	async decode(
		context: Context,
		storage_value: StorageType,
		old_value: any,
		format_params: any,
		is_http_api_request = false
	): Promise<DecodedType | null> {
		context.app.Logger.debug3("FIELD DECODE", this.name, {
			storage_value,
			old_value,
		});
		return storage_value as unknown as DecodedType;
	}

	/** Generates a mongo query based on the filter value */
	async getMatchQueryValue(context: Context, filter: any): Promise<any> {
		return this.encode(context, filter);
	}

	async getMatchQuery(
		context: Context,
		filter: any,
		value_path: string
	): Promise<any> {
		return {
			[value_path]: await this.getMatchQueryValue(context, filter),
		};
	}

	/** Whether or not the db should create a fulltext index on this field */
	async fullTextSearchEnabled(): Promise<boolean> {
		return false;
	}

	/** Whether or not a field has a default value - that is, a value
	 * given to the field if no value is provided */
	hasDefaultValue() {
		return true;
	}

	/** The default value that will be assigned to the field if no
	 * value is given */
	async getDefaultValue(_: Context): Promise<InputType | null> {
		return null;
	}

	/** Whether or not any of the methods of the field depend on the
	 * previous value of the field */
	isOldValueSensitive(_: ActionName) {
		return false;
	}

	/** Used to signal a positive decision from within {@link
	 * Field.isProperValue}. */
	static valid(): ValidationResult {
		return { valid: true };
	}

	/** Used to signal a negative decition from within {@link
	 * Field.isProperValue}. */
	static invalid(reason: string): ValidationResult {
		return { valid: false, reason };
	}

	/** Runs when the app is being started. Hooks can be set up within
	 * this function */
	async init(app: App, collection: Collection): Promise<void> {
		this.app = app;
		this.collection = collection;
	}

	async getAttachments(
		context: Context,
		values: any[], // this method gets called once for multiple resources, to limit the number of queries. Field values of all the resources are passed in this array
		attachment_options: any,
		format_params: any
	): Promise<ItemListResult<any>> {
		if (attachment_options !== undefined) {
			throw new BadSubjectAction(
				`Field '${this.name}' does not support attachments`
			);
		}
		return new ItemListResult([], [], {});
	}

	/** Creates parts of a Mongo Pipieline that will be used to filter
	 * the items when listing items of a collection */
	async getAggregationStages(
		context: Context,
		field_filter: unknown
	): Promise<QueryStage[]> {
		context.app.Logger.debug2(
			"FIELD",
			`${this.name}.getAggregationStages`,
			field_filter
		);
		if (field_filter === undefined) return [];
		const value_path = await this.getValuePath();
		let $match: MatchBody = {};
		if (field_filter === null) {
			$match = {
				$or: [
					{ [value_path]: { $exists: false } },
					{ [value_path]: null },
				],
			};
		} else if (field_filter instanceof Array) {
			$match = {
				[value_path]: {
					$in: await Promise.all(
						field_filter.map((value) => this.encode(context, value))
					),
				},
			};
		} else {
			$match = await this.getMatchQuery(
				context,
				field_filter,
				await this.getValuePath()
			);

			context.app.Logger.debug3("FIELD", "getAggregationStages", {
				value_path,
				$match,
				field_type: this.typeName,
			});
		}
		return [{ $match }];
	}
}
