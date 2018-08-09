const EventEmitter = require("events");

class QueryStore extends EventEmitter {
	constructor() {
		super();
	}
	init() {
		this.store.set("sort", {});
		this.store.on("change", () => this.emit("change"));
	}
	setFilter(filter) {
		this.store.set("filter", filter);
		this.store.set("pagination.page", 1);
	}
	setSort(sort) {
		this.store.set("sort", sort);
		this.store.set("pagination.page", 1);
	}
	getQuery() {
		return this.store.getStore();
	}
}
module.exports = QueryStore;

QueryStore.Stateful = require("./stateful-query-store.js");
