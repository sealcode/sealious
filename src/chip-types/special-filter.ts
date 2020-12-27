import App from "../app/app";
import Query, { QueryStage } from "../datastore/query";

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
		return this.app.collections[this.collection_name];
	}

	async checkSingleResource(app: App, resource_id: string) {
		const documents = await app.Datastore.aggregate(
			this.getCollection().name,
			[
				{ $match: { id: resource_id } },
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
