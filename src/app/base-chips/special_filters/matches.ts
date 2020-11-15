import { SpecialFilter, Query } from "../../../main";
import QueryStage from "../../../datastore/query-stage";

export default class Matches extends SpecialFilter {
	filter: {};
	constructor(collection_name: string, params: {}) {
		super(collection_name, params);
		this.filter = params;
	}

	async getFilteringQuery() {
		let pipeline: QueryStage[] = [];
		for (let field_name in this.filter) {
			const field_pipeline = await this.getCollection().fields[
				field_name
			].getAggregationStages(new this.app.SuperContext(), {
				filter: this.filter,
			});
			pipeline = pipeline.concat(field_pipeline);
		}
		return Query.fromCustomPipeline(pipeline);
	}

	getNopassReason() {
		return this.params.nopass_reason;
	}
}
