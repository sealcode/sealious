require("@babel/polyfill");

module.exports = {
	ResourceSelect: require("./lib/ResourceDropdown"),
	ResourceDropdown: require("./lib/ResourceDropdown"),
	Collection: require("./lib/collection"),
	Resource: require("./lib/resource"),
	QueryStores: require("./lib/query-stores/query-store.js"),
	Loading: require("./lib/loading"),
	CachedHttp: require("./lib/cached-http.js"),
	KeyValueStore: require("./lib/stores/key-value-store.js"),
	Form: require("./lib/mixins/form"),
	ConnectWithKeyValueStore: require("./lib/stores/connect-with-key-value-store"),
	CollectionResponse: require("./common_lib/response/collection-response.js"),
	SingleItemResponse: require("./common_lib/response/single-item-response.js"),
	APIs: {
		SingleResourceAPI: require("./lib/api/single-resource-api.js"),
	},
	form: require("./lib/mixins/form"),
	GetCustomResource: require('./lib/get-custom-resource/get-custom-resource')
};
