const React = require("react");
const CachedHttp = require("./cached-http.js");
const KeyValueStore = require("./stores/key-value-store.js");
const ConnectWithKeyValueStore = require("./stores/connect-with-key-value-store.jsx");

function Collection(
	{
		collection,
		query_store,
		get_forced_filter = () => {},
		get_forced_format = () => {},
	},
	component
) {
	return class Component extends React.Component {
		constructor() {
			super();
			this.state = {
				loading: true,
				resources: [],
			};
		}
		componentDidMount() {
			this.refreshComponent();
		}
		componentDidUpdate(prevProps, prevState) {
			const serialized_last_filter = JSON.stringify(
				get_forced_filter(prevProps)
			);
			const serialized_current_filter = JSON.stringify(
				get_forced_filter(this.props)
			);
			if (serialized_last_filter !== serialized_current_filter) {
				this.refreshComponent();
			}
		}
		refreshComponent() {
			this.setState({ loading: true });
			CachedHttp.get(`/api/v1/collections/${collection}`, {
				filter: Object.assign(
					{},
					query_store.getQuery().filter,
					get_forced_filter(this.props)
				),
				format: get_forced_format(this.props),
			}).then(resources => {
				this.setState({ resources, loading: false });
			});
		}
		render() {
			return React.createElement(component, {
				collection,
				query_store,
				resources: this.state.resources,
				loading: this.state.loading,
				metadata: this.props.metadata,
			});
		}
	};
}

module.exports = Collection;
