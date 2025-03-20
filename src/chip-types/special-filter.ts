import type { App } from "../app/app.js";
import type Query from "../datastore/query.js";
import type { QueryStage } from "../datastore/query.js";

export default abstract class SpecialFilter {
	params: any;
	app: App;
	collection_name: string;

	constructor(collection_name: string, params: any) {
		this.params = params;
		this.collection_name = collection_name;
	}

	init(app: App) {
		this.app = app;
	}

	abstract getFilteringQuery(): Promise<Query>;
	abstract getNopassReason(): string;

	getCollection() {
		const collection = this.app.collections[this.collection_name];
		if (collection) {
			return collection;
		} else {
			throw new Error("collection is missing");
		}
	}

	async checkSingleResource(app: App, resource_id: string) {
		const collection = this.getCollection();
		if (!collection) {
			throw new Error("collection is missing");
		}

		const documents = await app.Datastore.aggregate(collection.name, [
			{ $match: { id: resource_id } },
			...(await this.getFilteringQuery()).toPipeline(),
		] as QueryStage[]);
		return documents.length
			? SpecialFilter.pass()
			: SpecialFilter.nopass(this.getNopassReason());
	}

	static pass = async () => ({ passed: true });
	static nopass = async (reason: string) => ({ passed: false, reason });
}
