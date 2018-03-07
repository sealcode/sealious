const locreq = require("locreq")(__dirname);
const Filter = locreq("lib/chip-types/filter.js");

const assert = require("assert");
const Collection = locreq("lib/chip-types/collection");

module.exports = Filter.WithParams(
	class IsReferencedByResourcesMatching extends Filter {
		constructor(params) {
			super(...params);
			const {
				collection,
				referencing_field,
				field_to_check,
				allowed_values,
				nopass_reason,
			} = params;

			assert(params);
			assert(collection instanceof Collection);
			assert(collection.fields[referencing_field]);
			assert(collection.fields[field_to_check]);
			assert(Array.isArray(allowed_values));
			assert(typeof nopass_reason === "string");
		}

		getAggregationStages() {
			return [
				{
					$lookup: {
						from: this.params.collection,
						localField: "sealious_id",
						foreignField: this.params.referencing_field,
						as: "resource",
					},
				},
				{
					$match: {
						[`resource.body.${this.params.field_to_check}`]: {
							$in: this.params.allowed_values,
						},
					},
				},
			];
		}

		getNopassReason() {
			return this.params.nopass_reason;
		}
	}
);
