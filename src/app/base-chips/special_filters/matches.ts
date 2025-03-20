import { Query } from "../../../main.js";
import type { QueryStage } from "../../../datastore/query-stage.js";
import SpecialFilter from "../../../chip-types/special-filter.js";

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
			const collection = this.getCollection();
			if (!collection) {
				throw new Error("collection is missing");
			}

			const field = collection.fields[field_name];
			if (!field) {
				throw new Error("field is missing");
			}

			const field_pipeline = await field.getAggregationStages(
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
