import type Collection from "./collection.js";
import type {
	ExtractFieldDecoded,
	FieldsetEncoded,
	FieldsetInput,
	FieldsetOutput,
} from "../main.js";
import { Fieldset } from "./fieldset.js";
import type { CollectionOutput } from "./collection.js";

export type FieldNames<T extends Collection> = keyof T["fields"] & string;

export type ItemFieldsOutput<T extends Collection> = {
	[field in FieldNames<T>]: ExtractFieldDecoded<T["fields"][field]>;
};

export default class CollectionItemBody<
	T extends Collection = any
> extends Fieldset<T["fields"]> {
	constructor(
		public collection: T,
		public raw_input: Partial<FieldsetInput<T["fields"]>> = {},
		public decoded: Partial<FieldsetOutput<T["fields"]>> = {},
		public encoded: Partial<FieldsetEncoded<T["fields"]>> = {}
	) {
		super(collection.fields, raw_input, decoded, encoded);
	}

	copy(): CollectionItemBody<T> {
		return new CollectionItemBody<T>(
			this.collection,
			{ ...this.raw_input },
			{ ...this.decoded },
			{ ...this.encoded }
		);
	}

	static empty<C extends Collection>(collection: C): CollectionItemBody<C> {
		return new CollectionItemBody<C>(collection, {}, {}, {});
	}

	static fromDecoded<C extends Collection>(
		collection: C,
		decoded: Partial<CollectionOutput<C>>
	) {
		return new CollectionItemBody<C>(collection, {}, decoded, {});
	}
}
