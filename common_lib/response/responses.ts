import type CollectionItem from "../../src/chip-types/collection-item.js";

export class NewSession {
	status: string;
	message: string;
	data: any;
	metadata: any;
	constructor(session_id: string) {
		this.status = "success";
		this.message = "Logged in!";
		Object.defineProperty(this, "metadata", {
			value: { session_id: session_id },
		});
		this.data = {};
	}
}

export class ResourceCreated {
	[field: string]: any;
	constructor(item: CollectionItem) {
		for (const field in item.collection.fields) {
			this[field] = item.get(field);
		}
		this.id = item.id;
	}
}
