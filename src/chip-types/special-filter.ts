import assert from "assert";

import Collection from "./collection";
import App from "../app/app";

export default abstract class SpecialFilter {
	params: any;
	app: App;
	collection: Collection;
	constructor(app: App, collection: Collection, params: any) {
		this.params = params;
		this.app = app;
		this.collection = collection;
	}

	abstract getFilteringQuery(): any;
	abstract getNopassReason(): string;

	async checkSingleResource(app: App, resource_id: string) {
		const documents = await app.Datastore.aggregate(this.collection.name, [
			{ $match: { sealious_id: resource_id } },
			...this.getFilteringQuery(),
		]);

		return documents.length
			? SpecialFilter.pass()
			: SpecialFilter.nopass(this.getNopassReason());
	}

	static pass = async () => ({ passed: true });
	static nopass = async (reason: string) => ({ passed: false, reason });
}
