const locreq = require("locreq")(__dirname);
const assert = require("assert");

const SpecialFilter = locreq("lib/chip-types/special-filter.js");
const Collection = locreq("lib/chip-types/collection");
const SuperContext = locreq("lib/super-context.js");

module.exports = SpecialFilter.WithParams(
	class Matches extends SpecialFilter {
		constructor(params) {
			super(params);
			assert(params);
			this.filter = params;
		}

		async getAggregationStages(collection) {
			return Promise.all(
				Object.keys(this.filter).map(field_name =>
					collection.fields[field_name].get_aggregation_stages(
						new SuperContext(),
						{
							filter: this.filter,
						}
					)
				)
			).then(stages =>
				stages.reduce((acc, curr) => acc.concat(curr), [])
			);
		}

		getNopassReason() {
			return this.params.nopass_reason;
		}
	}
);
