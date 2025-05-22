import Field from "./field.js";

import type Context from "../context.js";
import type { App, Collection, ItemListResult } from "../main.js";
import { OpenApiTypes } from "../schemas/open-api-types.js";

/*

A hybrid field is one that takes a field type as a param. All
uncustomized methods should be taken from that given field type

*/

export default abstract class HybridField<
	ParsedType,
	InputType,
	StorageType,
	InnerParsedType,
	InnerInputType,
	InnerStorageType,
	T extends Field<InnerParsedType, InnerInputType, InnerStorageType>,
> extends Field<ParsedType, InputType, StorageType> {
	virtual_field: T;

	open_api_type = OpenApiTypes.NONE;

	async getOpenApiSchema(context: Context): Promise<Record<string, unknown>> {
		return await this.virtual_field.getOpenApiSchema(context);
	}

	constructor(base_field: T) {
		super();
		this.virtual_field = base_field;
		this.open_api_type = base_field.open_api_type;
	}

	setName(name: string) {
		super.setName(name);
		this.virtual_field.setName(name);
	}

	setCollection(collection: Collection) {
		super.setCollection(collection);
		this.virtual_field.setCollection(collection);
	}

	async encode(
		context: Context,
		value: InputType | null,
		old_value?: InputType
	) {
		return this.virtual_field.encode(
			context,
			value as unknown as InnerInputType,
			old_value
		) as StorageType;
	}

	async getMatchQueryValue(context: Context, filter: any) {
		return this.virtual_field.getMatchQueryValue(context, filter);
	}

	async getMatchQuery(context: Context, filter: any) {
		return this.virtual_field.getMatchQuery(
			context,
			filter,
			await this.getValuePath()
		);
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value: Parameters<T["checkValue"]>[2],
		new_value_blessing_token: symbol | null
	) {
		return this.virtual_field.checkValue(
			context,
			new_value,
			old_value,
			new_value_blessing_token
		);
	}

	async decode(
		context: Context,
		storage_value: StorageType,
		old_value: Parameters<T["decode"]>[2],
		format: Parameters<T["decode"]>[3]
	) {
		return this.virtual_field.decode(
			context,
			storage_value as unknown as InnerStorageType,
			old_value,
			format
		) as ParsedType;
	}

	async getAttachments(
		context: Context,
		values: any[],
		attachment_options: any,
		format: Parameters<T["decode"]>[3]
	): Promise<ItemListResult<any>> {
		return this.virtual_field.getAttachments(
			context,
			values,
			attachment_options,
			format
		);
	}

	async init(app: App, collection: Collection) {
		await super.init(app, collection);
		await this.virtual_field.init(app, collection);
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return this.virtual_field.getPostgreSqlFieldDefinitions();
	}
}
