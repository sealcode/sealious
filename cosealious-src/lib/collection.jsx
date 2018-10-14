const React = require("react");
const CachedHttp = require("./cached-http.js");

const default_forced_query = props => ({
	filter: {},
	format: {},
	sort: {},
});

function Collection(
	{ collection, query_store, get_forced_query = default_forced_query },
	component
) {
	return class Component extends React.Component {
		constructor() {
			super();
			this.query_store = query_store;
			this.state = {
				loading: true,
				resources: [],
				response: { attachments: {}, items: [] },
			};
		}
		componentDidMount() {
			this.refreshComponent();
			this.query_store.on("change", () => this.refreshComponent());
		}
		componentDidUpdate(prevProps, prevState) {
			const serialized_last_filter = JSON.stringify(
				get_forced_query(prevProps).filter
			);
			const serialized_current_filter = JSON.stringify(
				get_forced_query(this.props).filter
			);
			if (serialized_last_filter !== serialized_current_filter) {
				this.refreshComponent();
			}
		}
		refreshComponent(options) {
			const default_options = {
				force: false,
				show_loading: true,
			};
			const { force, show_loading } = {
				...default_options,
				...options,
			};
			if (force) CachedHttp.flush();
			if (show_loading) this.setState({ loading: true });
			CachedHttp.get(`/api/v1/collections/${collection}`, {
				filter: {
					...query_store.getQuery().filter,
					...get_forced_query(this.props).filter,
				},
				format: get_forced_query(this.props).format,
				sort: {
					...query_store.getQuery().sort,
					...get_forced_query(this.props).sort,
				},
			}).then(response => {
				this.setState({
					response,
					resources: response.items,
					loading: false,
				});
			});
		}
		render() {
			return React.createElement(component, {
				collection,
				query_store: this.query_store,
				...this.state,
				metadata: this.props.metadata,
				refresh: this.refreshComponent.bind(this),
			});
		}
	};
}

module.exports = Collection;
