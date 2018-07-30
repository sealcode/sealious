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
	load() {
		this.loading = true;
		return CachedHttp.get(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			{ filter: this.filter, format: this.format }
		).then(response => {
			this.loading = false;
			this.data = response;
			this.emit("change", response);
		});
	}
	setLoading(loading) {
		this.loading = loading;
		this.emit("change", this.data);
	}
	patch(body) {
		this.loading = true;
		return axios
			.patch(`/api/v1/collections/${this.collection_name}/${this.id}`)
			.then(response => {
				this.loading = false;
				this.data = response;
				this.emit("change", response);
			});
	}
};
