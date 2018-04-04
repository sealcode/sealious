const locreq = require("locreq")(__dirname);
const assert = require("assert");

const Collection = locreq("lib/chip-types/collection");

module.exports = app => {
	class SpecialFilter {
		constructor(params) {
			this.params = params;
		}

		async checkSingleResource(app, collection, resource_id) {
			assert(collection instanceof Collection);

			const documents = await app.Datastore.aggregate(collection.name, [
				{ $match: { sealious_id: resource_id } },
				...this.getFilteringQuery(),
			]);

			return documents.length
				? SpecialFilter.pass()
				: SpecialFilter.nopass(this.getNopassReason());
		}
	}

	SpecialFilter.WithParams = _class => (...params) => new _class(...params);

	SpecialFilter.pass = async () => ({ passed: true });
	SpecialFilter.nopass = async reason => ({ passed: false, reason });

	return SpecialFilter;
};
