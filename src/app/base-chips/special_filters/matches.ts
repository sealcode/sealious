import assert from "assert";
import App from "../../app";
import SpecialFilter from "../../../chip-types/special-filter";
import QueryStage from "../../../datastore/query-stage";
import SuperContext from "../../../super-context";
import Collection from "../../../chip-types/collection";

const Query = require("../../../datastore/query.js").default;

export default class Matches extends SpecialFilter {
	filter: {};
	constructor(app: App, collection: Collection, params: {}) {
		super(app, collection, params);
		this.filter = params;
	}

	async getFilteringQuery() {
		let pipeline: QueryStage[] = [];
		for (let field_name in this.filter) {
			const field_pipeline = await this.collection.fields[
				field_name
			].getAggregationStages(new SuperContext(), {
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
