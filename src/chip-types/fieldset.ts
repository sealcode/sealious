import type Context from "../context.js";
import type {
	ExtractStorage,
	FieldOutput,
	GetInputType,
	RequiredField,
} from "./field.js";
import type Field from "./field.js";

export type FieldNames<T extends Record<string, Field>> = keyof T & string;

export type FieldsetOutput<T extends Record<string, Field>> = {
	[field in keyof T]: FieldOutput<T[field]> | null;
};

export type FieldsetInput<T extends Record<string, Field>> =
	| {
			[field in keyof T & string as T[field] extends RequiredField<any>
				? field
				: never]: GetInputType<T[field]>;
	  } & {
			[field in keyof T & string as T[field] extends RequiredField<any>
				? never
				: field]?: GetInputType<T[field]>;
	  };

export type FieldsetEncoded<T extends Record<string, Field>> = {
	[field in keyof T]: ExtractStorage<T[field]>;
};

// a quick test for the types, shoud know which fields can be undefined
// const f = {
// 	a: new FieldTypes.Text().setRequired(true),
// 	b: new FieldTypes.Text(),
// };
// type fi = FieldsetInput<typeof f>;

export class Fieldset<Fields extends Record<string, Field>> {
	changed_fields: Set<keyof Fields> = new Set();
	is_decoded = false;
	is_encoded = false;
	blessings: Partial<Record<keyof Fields, symbol | null>> = {};

	constructor(
		public fields: Fields,
		public raw_input: Partial<FieldsetInput<Fields>> = {},
		public decoded: Partial<FieldsetOutput<Fields>> = {},
		public encoded: Partial<FieldsetEncoded<Fields>> = {}
	) {
		for (const field_name in raw_input) {
			if (!encoded[field_name as keyof Fields]) {
				this.changed_fields.add(field_name as keyof Fields);
			}
		}
	}

	getRequiredFields(): Field[] {
		return Object.values(this.fields).filter((f) => f.required);
	}

	set<FieldName extends keyof FieldsetInput<Fields> & string>(
		field_name: FieldName,
		field_value: FieldsetInput<Fields>[FieldName],
		blessing_symbol: symbol | null = null // those symbols can be used as a proof that a value came from e.g. an internal callback, and not from user input
	): this {
		this.raw_input[field_name] = field_value;
		this.is_decoded = false;
		this.is_encoded = false;
		this.changed_fields.add(field_name);
		this.blessings[field_name] = blessing_symbol;
		return this;
	}

	clearChangedFields() {
		this.changed_fields.clear();
	}

	getDecoded<FieldName extends keyof Fields>(field_name: FieldName) {
		if (!this.is_decoded) {
			throw new Error("Decode first!");
		}
		return this.decoded[field_name as keyof typeof this.decoded];
	}

	getInput<FieldName extends keyof FieldsetInput<Fields>>(
		field_name: FieldName
	) {
		return this.raw_input[field_name];
	}

	getEncoded<FieldName extends keyof Fields>(field_name: FieldName) {
		return this.encoded[field_name];
	}

	/** Returns encoded values for every field */
	async encode(
		context: Context,
		original_body: FieldsetInput<Fields> = {} as FieldsetInput<Fields>,
		only_changed = false
	): Promise<Partial<FieldsetOutput<Fields>>> {
		context.app.Logger.debug3(
			"ITEM BODY",
			"encode",
			this.changed_fields.values()
		);
		const new_encoded: Partial<FieldsetOutput<Fields>> = {};
		const promises = [];
		for (const field_name of this.changed_fields.values()) {
			const to_encode =
				this.raw_input[field_name as keyof FieldsetInput<Fields>];
			context.app.Logger.debug3("ITEM BODY", "encoding value", {
				[field_name]:
					this.raw_input[field_name as keyof FieldsetInput<Fields>],
				is_the_value_empty:
					to_encode === undefined || to_encode === null,
			});
			if (!this.fields[field_name as string]) {
				// field does not exist in this collection
				continue;
			}

			if (to_encode === undefined) {
				new_encoded[field_name as keyof typeof new_encoded] = null;
				continue;
			}
			promises.push(
				this.fields[field_name as string]
					.encode(
						context,
						to_encode,
						original_body[field_name as keyof FieldsetInput<Fields>]
					)
					.then((value) => {
						new_encoded[field_name as keyof typeof new_encoded] =
							value;
					})
			);
		}
		await Promise.all(promises);
		this.encoded = { ...this.encoded, ...new_encoded };
		this.is_encoded = true;
		context.app.Logger.debug2("ITEM BODY", "encode result", this.encoded);
		return only_changed ? new_encoded : this.encoded;
	}

	async decode(
		context: Context,
		format: { [field_name: string]: any } = {},
		is_http_api_request = false
	): Promise<Fieldset<Fields>> {
		if (this.is_decoded) return this;
		context.app.Logger.debug3("ITEM BODY", "Decoding item", {
			format,
			body: this.encoded,
		});
		const promises: Promise<any>[] = [];
		for (const [field_name, encoded_value] of Object.entries(
			this.encoded
		)) {
			if (!this.fields?.[field_name]) {
				continue;
			}
			const encoded = this.encoded;
			promises.push(
				this.fields?.[field_name]
					.decode(
						context,
						encoded[field_name],
						null,
						format?.[field_name],
						is_http_api_request
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

	copy(): Fieldset<Fields> {
		return new Fieldset<Fields>(
			this.fields,
			{ ...this.raw_input },
			{ ...this.decoded },
			{ ...this.encoded }
		);
	}

	async validate(
		context: Context,
		original_body: Fieldset<Fields>,
		replace_mode: boolean //if true, meaning that if a field has no value, it should be deleted
	): Promise<{
		valid: boolean;
		errors: { [f in keyof Fields]?: { message: string } };
	}> {
		const promises = [];
		const errors: { [f in keyof Fields]?: { message: string } } = {};
		let valid = true;
		const fields_to_check = new Set(this.changed_fields.values());
		if (replace_mode) {
			for (const field of this.getRequiredFields()) {
				fields_to_check.add(field.name as keyof Fields);
			}
		}

		for (const field_name of fields_to_check) {
			if (!this.fields[field_name as string]) {
				// field does not exist
				continue;
			}
			promises.push(
				this.fields[field_name as string]
					.checkValue(
						context,
						this.raw_input[
							field_name as keyof FieldsetInput<Fields>
						],
						original_body.encoded[field_name as keyof Fields],
						this.blessings[field_name] || null
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

	getBlessing<FieldName extends keyof Fields>(
		field_name: FieldName
	): symbol | null {
		return this.blessings[field_name] || null;
	}

	setMultiple(values: Partial<FieldsetInput<Fields>>): this {
		for (const [field_name, value] of Object.entries(values)) {
			this.set(field_name as any, value as any);
		}
		return this;
	}
}
