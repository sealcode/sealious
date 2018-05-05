const EventEmitter = require("events");

class QueryStore extends EventEmitter {
	constructor() {
		super();
	}
	init() {
		this.store.on("change", () => this.emit("change"));
	}
	setFilter(filter) {
		this.store.set("filter", filter);
		this.store.set("pagination.page", 1);
	}
	getQuery() {
		return this.store.getStore();
	}
}
module.exports = QueryStore;

QueryStore.Stateful = require("./stateful-query-store.js");
