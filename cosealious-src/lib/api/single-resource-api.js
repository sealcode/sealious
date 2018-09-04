const axios = require("axios");
const CachedHttp = require("../cached-http.js");
const EventEmitter = require("events");

module.exports = class SingleResourceAPI extends EventEmitter {
	constructor(collection_name, id, options) {
		super();
		this.id = id;
		this.collection_name = collection_name;
		this.data = null;
		this.loading = true;
		this.filter = (options && options.filter) || {};
		this.format = (options && options.format) || {};
	}
	setLoading(loading) {
		this.loading = loading;
		this.emit("change", this.data);
	}
	async load() {
		this.loading = true;
		const response = await CachedHttp.get(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			{ filter: this.filter, format: this.format }
		);
		this.loading = false;
		this.data = response;
		this.emit("change", this.data);
	}
	async patch(body) {
		this.loading = true;
		await axios.patch(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			body
		);
		CachedHttp.flush();
		const response = await CachedHttp.get(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			{ filter: this.filter, format: this.format }
		);
		this.loading = false;
		this.data = response;
		this.emit("change", this.data);
	}
};
