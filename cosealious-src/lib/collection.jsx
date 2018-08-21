const React = require("react");
const CachedHttp = require("./cached-http.js");
const QueryStore = require("./query-stores/query-store");

function Collection(
	{
		collection,
		query_store_class = QueryStore.Stateful,
		get_forced_filter = () => {},
		get_forced_format = () => {},
		get_forced_sort = () => {},
	},
	component
) {
	return class Component extends React.Component {
		constructor() {
			super();
			this.query_store = new query_store_class();
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
				get_forced_filter(prevProps)
			);
			const serialized_current_filter = JSON.stringify(
				get_forced_filter(this.props)
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
			const { force, show_loading } = Object.assign(
				{},
				default_options,
				options
			);
			if (force) CachedHttp.flush();
			if (show_loading) this.setState({ loading: true });
			CachedHttp.get(`/api/v1/collections/${collection}`, {
				filter: Object.assign(
					{},
					this.query_store.getQuery().filter,
					get_forced_filter(this.props)
				),
				format: get_forced_format(this.props),
				sort: Object.assign(
					{},
					this.query_store.getQuery().sort,
					get_forced_sort(this.props)
				),
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
