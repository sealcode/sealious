const assert = require("assert");
const Collection = require("../../../chip-types/collection");
const Query = require("../../../datastore/query.js");

module.exports = (app) => {
	const parametrized = app.SpecialFilter.WithParams(
		class IsReferencedByResourcesMatching extends app.SpecialFilter {
			constructor(params) {
				const {
					collection,
					referencing_field,
					field_to_check,
					allowed_values,
					nopass_reason,
				} = params;
				super(params);
				assert(params);
				assert(collection);
				assert(collection instanceof Collection);
				assert(collection.fields[referencing_field]);
				assert(collection.fields[field_to_check]);
				assert(Array.isArray(allowed_values));
				assert(typeof nopass_reason === "string");
			}
			async getFilteringQuery() {
				const query = new Query();
				const lookup_id = query.lookup({
					from: this.params.collection.name,
					localField: "sealious_id",
					foreignField: this.params.referencing_field,
				});
				query.match({
					[`${lookup_id}.${this.params.field_to_check}`]: {
						$in: this.params.allowed_values,
					},
				});
				return query;
			}

			getNopassReason() {
				return this.params.nopass_reason;
			}
		}
	);
	app.SpecialFilter.IsReferencedByResourcesMatching = parametrized;
};
