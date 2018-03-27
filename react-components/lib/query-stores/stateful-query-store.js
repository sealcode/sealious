const KeyValueStore = require("./../stores/key-value-store.js");
const QueryStore = require("./query-store.js");

module.exports = class StatefulQueryStore extends QueryStore {
	constructor() {
		super();
		this.store = new KeyValueStore({
			filter: {},
			pagination: { page: 1, items: 12 },
		});
		this.init();
	}
};
