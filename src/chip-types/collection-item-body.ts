import Collection from "./collection";
import { Context, ExtractInput } from "../main";
import { ExtractOutput } from "./field";

export type ItemFields<T extends Collection> = {
	[field in keyof T["fields"]]: ExtractInput<T["fields"][field]>;
};

export type ItemFieldsOutput<T extends Collection> = {
	[field in keyof T["fields"]]: ExtractOutput<T["fields"][field]>;
};

export default class CollectionItemBody<T extends Collection = any> {
	changed_fields: Set<keyof ItemFields<T>> = new Set();
	is_decoded = false;
	is_encoded = false;

	constructor(
		public collection: T,
		public raw_input: Partial<ItemFields<T>> = {},
		public decoded: Partial<ItemFields<T>> = {},
		public encoded: Partial<ItemFields<T>> = {}
	) {
		for (const field_name in raw_input) {
			if (!encoded[field_name]) {
				this.changed_fields.add(field_name);
			}
		}
	}

	set<FieldName extends keyof ItemFields<T>>(
		field_name: FieldName,
		field_value: ItemFields<T>[FieldName]
	) {
		this.raw_input[field_name] = field_value;
		this.is_decoded = false;
		this.is_encoded = false;
		this.changed_fields.add(field_name);
	}

	clearChangedFields() {
		this.changed_fields.clear();
	}

	getDecoded<FieldName extends keyof ItemFields<T>>(field_name: FieldName) {
		if (!this.is_decoded) {
			throw new Error("Decode first!");
		}
		return this.decoded[field_name];
	}

	getInput<FieldName extends keyof ItemFields<T>>(field_name: FieldName) {
		return this.raw_input[field_name];
	}

	getEncoded<FieldName extends keyof ItemFields<T>>(field_name: FieldName) {
		return this.encoded[field_name];
	}

	/** Returns encoded values for every field */
	async encode(context: Context): Promise<ItemFields<T>> {
		context.app.Logger.debug3(
			"ITEM BODY",
			"encode",
			this.changed_fields.values()
		);
		const encoded: Partial<ItemFields<T>> = {};
		const promises = [];
		for (const field_name of this.changed_fields.values()) {
			const to_encode = this.raw_input[field_name];
			context.app.Logger.debug3("ITEM BODY", "encoding value", {
				[field_name]: this.raw_input[field_name],
				is_the_value_empty:
					to_encode === undefined || to_encode === null,
			});
			if (!this.collection.fields[field_name as string]) {
				// field does not exist in this collection
				continue;
			}

			if (to_encode === undefined) {
				encoded[field_name] = null;
				continue;
			}
			promises.push(
				this.collection.fields[field_name as string]
					.encode(context, to_encode)
					.then((value) => {
						encoded[field_name] = value;
					})
			);
		}
		await Promise.all(promises);
		this.encoded = encoded;
		this.is_encoded = true;
		context.app.Logger.debug2("ITEM BODY", "encode result", this.encoded);
		return this.encoded as ItemFields<T>;
	}

	async decode(
		context: Context,
		format: { [field_name: string]: any } = {}
	): Promise<CollectionItemBody<T>> {
		if (this.is_decoded) return this;
		context.app.Logger.debug3("ITEM BODY", "Decoding item", {
			format,
			body: this.encoded,
		});
		const promises: Promise<any>[] = [];
		for (const field_name in this.encoded) {
			if (!this.collection.fields?.[field_name]) {
				continue;
			}
			promises.push(
				this.collection.fields?.[field_name]
					.decode(
						context,
						this.encoded[field_name],
						null,
						format?.[field_name]
					)
					.then((decoded_value) => {
						this.decoded = {
							...this.decoded,
							[field_name]: decoded_value,
						};
						context.app.Logger.debug3(
							"ITEM BODY",
							"Decoded value",
							{
								[field_name]: decoded_value,
							}
						);
					})
			);
		}
		await Promise.all(promises);
		this.is_decoded = true;
		return this;
	}

	static fromDB(
		collection: Collection,
		database_entry: { [field_name: string]: any }
	) {
		delete database_entry._id; //the mongo ID
		return new CollectionItemBody<typeof collection>(
			collection,
			{},
			{},
			database_entry
		);
	}

	static fromDecoded<T extends Collection>(
		collection: T,
		decoded: Partial<ItemFields<T>>
	) {
		return new CollectionItemBody<T>(collection, {}, decoded, {});
	}

	copy(): CollectionItemBody<T> {
		return new CollectionItemBody<T>(
			this.collection,
			{ ...this.raw_input },
			{ ...this.decoded },
			{ ...this.encoded }
		);
	}

	async validate(
		context: Context,
		original_body: CollectionItemBody,
		replace_mode: boolean //if true, meaning that if a field has no value, it should be deleted
	): Promise<{
		valid: boolean;
		errors: { [f in keyof ItemFields<T>]?: { message: string } };
	}> {
		const promises = [];
		const errors: { [f in keyof ItemFields<T>]?: { message: string } } = {};
		let valid = true;
		const fields_to_check = new Set(this.changed_fields.values());
		if (replace_mode) {
			for (const field of this.collection.getRequiredFields()) {
				fields_to_check.add(field.name);
			}
		}

		for (const field_name of fields_to_check) {
			if (!this.collection.fields[field_name as string]) {
				// field does not exist
				continue;
			}
			promises.push(
				this.collection.fields[field_name as string]
					.checkValue(
						context,
						this.raw_input[field_name],
						original_body.encoded[field_name]
					)
					.then(async (result) => {
						if (!result.valid) {
							valid = false;
							errors[field_name] = {
								message: result.reason as string,
							};
						}
					})
			);
		}
		await Promise.all(promises);
		return { valid, errors };
	}

	static empty<T extends Collection>(collection: T) {
		return new CollectionItemBody<T>(collection, {}, {}, {});
	}
}
