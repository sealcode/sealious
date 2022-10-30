import Field, { Depromisify } from "./field";

import type Context from "../context";
import type { App, Collection, ItemListResult } from "../main";

/*

A hybrid field is one that takes a field type as a param. All
uncustomized methods should be taken from that given field type

*/

export default abstract class HybridField<T extends Field> extends Field {
	virtual_field: T;

	constructor(base_field: T) {
		super();
		this.virtual_field = base_field;
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
		value: Parameters<T["encode"]>[1],
		old_value?: Parameters<T["encode"]>[2]
	) {
		return this.virtual_field.encode(context, value, old_value);
	}

	async getMatchQueryValue(context: Context, filter: any) {
		return this.virtual_field.getMatchQueryValue(context, filter);
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
		decoded_value: Depromisify<ReturnType<this["encode"]>>,
		old_value: Parameters<T["decode"]>[2],
		format: Parameters<T["decode"]>[3]
	) {
		return this.virtual_field.decode(
			context,
			decoded_value,
			old_value,
			format
		);
	}

	async getAttachments(
		context: Context,
		values: any[],
		attachment_options: any
	): Promise<ItemListResult<any>> {
		return this.virtual_field.getAttachments(
			context,
			values,
			attachment_options
		);
	}

	async init(app: App, collection: Collection) {
		await super.init(app, collection);
		await this.virtual_field.init(app, collection);
	}
}
