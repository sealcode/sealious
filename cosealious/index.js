module.exports = {
	ResourceSelect: require("./lib/ResourceDropdown.jsx"),
	ResourceDropdown: require("./lib/ResourceDropdown.jsx"),
	Collection: require("./lib/collection.jsx"),
	Resource: require("./lib/resource.jsx"),
	QueryStores: require("./lib/query-stores/query-store.js"),
	Loading: require("./lib/loading.jsx"),
	CachedHttp: require("./lib/cached-http.js"),
	KeyValueStore: require("./lib/stores/key-value-store.js"),
	ConnectWithKeyValueStore: require("./lib/stores/connect-with-key-value-store.jsx"),
	APIs: {
		SingleResourceAPI: require("./lib/api/single-resource-api.js"),
	},
};
