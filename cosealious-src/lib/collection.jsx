const React = require("react");
const CachedHttp = require("./cached-http.js");
const CollectionResponse = require("../common_lib/response/collection-response.js");
const QueryStore = require("./query-stores/query-store");

const default_forced_query = props => ({
	filter: {},
	format: {},
	sort: {},
	attachments: {},
});

function Collection(
	{ collection, query_store_class = QueryStore.Stateful, get_forced_query = default_forced_query },
	component
) {
	return class Component extends React.Component {
		constructor() {
			super();
			this.query_store = new query_store_class();
			this.state = {
				loading: true,
				resources: [],
				response: null,
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

			return CachedHttp.get(`/api/v1/collections/${collection}`, {
				attachments: get_forced_query(this.props).attachments,
				filter: {
					...this.query_store.getQuery().filter,
					...get_forced_query(this.props).filter,
				},
				format: get_forced_query(this.props).format,
				sort: {
					...this.query_store.getQuery().sort,
					...get_forced_query(this.props).sort,
				},
			}).then(http_response => {
				const response = new CollectionResponse(http_response);
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
