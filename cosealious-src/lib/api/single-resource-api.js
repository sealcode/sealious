const axios = require("axios");
const CachedHttp = require("../cached-http.js");
const EventEmitter = require("events");
const SingleItemResponse = require("../../common_lib/response/single-item-response.js");

module.exports = class SingleResourceAPI extends EventEmitter {
	constructor(collection_name, id, options) {
		super();
		this.id = id;
		this.collection_name = collection_name;
		this.response = null;
		this.loading = true;
		this.filter = (options && options.filter) || {};
		this.format = (options && options.format) || {};
		this.attachments = (options && options.attachments) || {};
	}
	setLoading(loading) {
		this.loading = loading;
		this.emit("change", this.response);
	}
	load() {
		this.loading = true;
		return this._load();
	}
	async _load() {
		const http_response = await CachedHttp.get(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			{
				filter: this.filter,
				format: this.format,
				attachments: this.attachments,
			}
		);

		this.response = new SingleItemResponse(http_response);
		this.setLoading(false);
	}
	async patch(body) {
		this.loading = true;
		await axios.patch(
			`/api/v1/collections/${this.collection_name}/${this.id}`,
			body
		);
		CachedHttp.flush();
		return this._load();
	}
};
