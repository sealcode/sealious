import React from "react";
import rest from "qwest";
import merge from "merge";
import deep_equal from "deep-equal";
import clone from "clone";
import Promise from "bluebird";

const Loading = require("../loading");
const CachedHttp = require("../cached-http");

export default function resourceTypeCollection(ComponentClass) {
	class resourceTypeWrapper extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				loading: false,
				resources: [],
				response: { attachments: {}, items: [] },
			};
			this.generateQuery = this.generateQuery.bind(this);
			this.fetch = this.fetch.bind(this);
			this.refresh = this.refresh.bind(this);
		}
		generateQuery(props) {
			let query = {};
			if (props.filter) {
				query.filter = props.filter;
				for (let i in query.filter) {
					if (
						query.filter[i] == "undefined" ||
						query.filter[i] === null
					) {
						delete query.filter;
					}
				}
			}
			const to_add = ["sort", "format", "search", "pagination"];
			to_add.forEach(function(key) {
				if (props[key]) {
					query[key] = props[key];
				}
			});
			return query;
		}
		reloadNeeded(query) {
			return !deep_equal(query, this.state.last_query);
		}
		fetch(query) {
			this.setState({
				loading: true,
			});
			return CachedHttp.get(this.props.url, query, {
				cache: true,
			}).then(response => {
				this.setState({
					loading: false,
					resources: this.props.customSort(response.items),
					response,
					last_query: clone(query),
				});
			});
		}
		refresh(force) {
			let query = this.generateQuery(this.props);
			this.fetch(query);
		}
		componentDidMount() {
			this.refresh();
		}
		componentWillReceiveProps(next_props) {
			if (!this.props.will_not_update)
				setTimeout(() => {
					this.refresh();
				}, 0);
		}
		delete(resource) {
			rest.delete(
				this.props.url + "/" + resource.id,
				{},
				{ cache: true }
			).then(() => {
				this.refresh(true);
			});
		}
		render() {
			if (this.state.loading) {
				return React.createElement(this.props.loadingComponent);
			}
			const customProps = {
				...this.state,
				delete: this.delete,
			};

			const child_props = merge(true, this.props, customProps);

			return React.createElement(ComponentClass, child_props);
		}
	}

	resourceTypeWrapper.defaultProps = {
		pagination: undefined, // could be: {page: 1, items: 12}
		filter: {},
		format: {},
		search: "",
		url: "/api/v1/collections/users",
		loadingComponent: () => React.createElement(Loading),
		customSort: list => list,
	};

	return resourceTypeWrapper;
}
