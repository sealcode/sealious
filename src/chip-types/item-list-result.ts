import CollectionItem from "./collection-item.js";
import type Collection from "./collection.js";

export class ItemListResult<T extends Collection> {
	constructor(
		public items: CollectionItem<T>[],
		public fields_with_attachments: string[],
		public attachments: { [id: string]: CollectionItem } = {}
	) {
		items.forEach((item) => item.setParentList(this));
	}

	// this generator method makes the instance of this class iterable with for..of
	*[Symbol.iterator](): Iterator<CollectionItem<T>> {
		for (const item of this.items) {
			yield item;
		}
	}

	get empty(): boolean {
		return this.items.length === 0;
	}

	serialize(): {
		items: Record<string, unknown>[];
		attachments: Record<string, Record<string, unknown>>;
		fields_with_attachments: string[];
	} {
		return {
			items: this.items.map((item) => item.serializeBody()),
			attachments: Object.fromEntries(
				Object.entries(this.attachments).map(([id, item]) => [
					id,
					item.serializeBody(),
				])
			),
			fields_with_attachments: this.fields_with_attachments,
		};
	}

	static fromSerialized<T extends Collection>(
		collection: T,
		serialized: {
			items: any[];
			attachments: { [id: string]: any };
			fields_with_attachments: string[];
		}
	): ItemListResult<Collection> {
		return new ItemListResult<T>(
			serialized.items.map((item_data) =>
				CollectionItem.fromSerialized(
					collection,
					item_data,
					serialized.attachments
				)
			),
			serialized.fields_with_attachments,
			serialized.attachments
		);
	}

	flattenWithAttachments() {
		return {
			...this.attachments,
			...Object.fromEntries(this.items.map((item) => [item.id, item])),
		};
	}
}
