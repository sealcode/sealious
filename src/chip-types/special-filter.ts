import Collection from "./collection";
import App from "../app/app";
import Query, { QueryStage } from "../datastore/query";

export default abstract class SpecialFilter {
	params: any;
	app: App;
	get_collection: () => Collection;

	constructor(app: App, get_collection: () => Collection, params: any) {
		this.params = params;
		this.get_collection = get_collection;
		this.app = app;
	}

	abstract async getFilteringQuery(): Promise<Query>;
	abstract getNopassReason(): string;

	getCollection() {
		return this.get_collection();
	}

	async checkSingleResource(app: App, resource_id: string) {
		const documents = await app.Datastore.aggregate(
			this.getCollection().name,
			[
				{ $match: { sealious_id: resource_id } },
				...(await this.getFilteringQuery()).toPipeline(),
			] as QueryStage[]
		);

		return documents.length
			? SpecialFilter.pass()
			: SpecialFilter.nopass(this.getNopassReason());
	}

	static pass = async () => ({ passed: true });
	static nopass = async (reason: string) => ({ passed: false, reason });
}
