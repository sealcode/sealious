const locreq = require("locreq")(__dirname);
const assert = require("assert");

const Query = locreq("lib/datastore/query.js");

module.exports = app => {
	const matches = app.SpecialFilter.WithParams(
		class Matches extends app.SpecialFilter {
			constructor(params) {
				super(params);
				assert(params);
				this.filter = params;
			}

			async getFilteringQuery(collection) {
				let pipeline = [];
				for (let field_name in this.filter) {
					const field_pipeline = await collection.fields[
						field_name
					].get_aggregation_stages(new app.Sealious.SuperContext(), {
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
	);
	app.SpecialFilter.Matches = matches;
	return matches;
};
