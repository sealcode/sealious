const React = require("react");
const CachedHttp = require("./cached-http.js");
const KeyValueStore = require("./stores/key-value-store.js");
const ConnectWithKeyValueStore = require("./stores/connect-with-key-value-store.jsx");

function Collection({ collection, query_store }, component) {
	return class Component extends React.Component {
		constructor() {
			super();
			this.state = {
				loading: true,
				resources: [],
			};
		}
		componentDidMount() {
			this.setState({ loading: true });
			CachedHttp.get(
				`/api/v1/collections/${collection}`,
				query_store.getQuery()
			).then(resources => {
				console.log(resources);
				this.setState({ resources, loading: false });
			});
		}
		render() {
			return React.createElement(component, {
				collection,
				query_store,
				resources: this.state.resources,
				loading: this.state.loading,
			});
		}
	};
}

module.exports = Collection;
