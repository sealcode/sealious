import Item from "./item";

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
	constructor(resource_representation: Item) {
		for (const field in resource_representation) {
			this[field] = resource_representation[field];
		}
	}
}

export { default as CollectionResponse } from "./collection-response";
export { default as SingleItemResponse } from "./single-item-response";
