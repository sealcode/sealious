import { CollectionEvent, CollectionCallback } from "../chip-types/collection";
import { App } from "../main";

export class EventDescription {
	constructor(
		public collection_name: string,
		public event_name: CollectionEvent
	) {}

	attachTo(app: App, callback: CollectionCallback) {
		app.collections[this.collection_name].on(this.event_name, callback);
	}
}
