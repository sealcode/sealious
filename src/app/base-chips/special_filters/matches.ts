import App from "../../app";
import { Collection, SpecialFilter } from "../../../main";
import QueryStage from "../../../datastore/query-stage";

const Query = require("../../../datastore/query.js").default;

export default class Matches extends SpecialFilter {
	filter: {};
	constructor(app: App, get_collection: () => Collection, params: {}) {
		super(app, get_collection, params);
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
