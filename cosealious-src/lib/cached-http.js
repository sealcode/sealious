const axios = require("axios");
const CancelToken = axios.CancelToken;
const url = require("url");
const merge = require("merge");
const Promise = require("bluebird");
const qs = require("qs");
Promise.config({ cancellation: true });

function CachedError() {}

CachedError.prototype = Error.prototype;

function respond_from_cache(value) {
	return Promise[value instanceof CachedError ? "reject" : "resolve"](value);
}

const CachedHttp = (function() {
	let cache = {};

	var pending = {};

	return {
		get: function(url_arg, query, options) {
			const parsed_url = url.parse(url_arg, true);
			delete parsed_url.search;
			const merged_query = merge(true, parsed_url.query, query);
			const { pathname } = parsed_url;

			const hash = pathname + "|" + JSON.stringify(merged_query);

			if (pending[hash]) {
				return Promise.resolve(pending[hash]).finally(() =>
					respond_from_cache(cache[hash])
				);
			}
			if (cache[hash]) {
				return respond_from_cache(cache[hash]);
			}
			const promise = new Promise((resolve, reject, onCancel) => {
				const source = CancelToken.source();
				onCancel(function() {
					delete cache[hash];
					delete pending[hash];
					source.cancel();
				});
				return axios
					.get(`${pathname}?${qs.stringify(merged_query)}`, {
						cancelToken: source.token,
						options,
					})
					.then(response => {
						const data = response.data;
						cache[hash] = data;
						delete pending[hash];
						resolve(data);
					})
					.catch(error => {
						const cached_err = Object.create(CachedError.prototype);
						Object.assign(cached_err, error);
						delete pending[hash];
						cache[hash] = cached_err;
						reject(cached_err);
					});
			});
			pending[hash] = promise.then(respond_from_cache).catch(() => {});
			return promise;
		},
		flush: function() {
			//resets cache
			cache = {};
		},
	};
})();

module.exports = CachedHttp;
