import { Query } from "../../../main";
import type QueryStage from "../../../datastore/query-stage";
import SpecialFilter from "../../../chip-types/special-filter";

export default class Matches extends SpecialFilter {
	constructor(
		collection_name: string,
		public filter: { [field_name: string]: any }
	) {
		super(collection_name, filter);
	}

	async getFilteringQuery() {
		let pipeline: QueryStage[] = [];
		for (let field_name in this.filter) {
			const field_pipeline = await this.getCollection().fields[
				field_name
			].getAggregationStages(
				new this.app.SuperContext(),
				this.filter[field_name]
			);
			pipeline = pipeline.concat(field_pipeline);
		}
		return Query.fromCustomPipeline(pipeline);
	}

	getNopassReason() {
		return this.params.nopass_reason;
	}
}
