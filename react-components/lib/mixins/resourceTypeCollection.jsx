import React from "react";
import rest from "qwest";
import merge from "merge";
import deep_equal from "deep-equal";
import clone from "clone";
import Promise from "bluebird";

const Loading = require("./../loading.js");
const CachedHttp = require("../cached-http.js");

export default function resourceTypeCollection(ComponentClass) {
    return React.createClass({
        getInitialState: function() {
            return {
                loading: false,
                resources: [],
            };
        },
        getDefaultProps: function() {
            return {
                pagination: undefined, // could be: {page: 1, items: 12}
                filter: {},
                format: {},
                search: "",
                url: "/api/v1/collections/users",
                loadingComponent: () => React.createElement(Loading),
                customSort: list => list,
            };
        },
        generateQuery: function(props) {
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
        },
        reloadNeeded: function(query) {
            return !deep_equal(query, this.state.last_query);
        },
        fetch: function(query) {
            this.setState({
                loading: true,
            });
            return CachedHttp.get(this.props.url, query, {
                cache: true,
            }).then(response => {
                this.setState({
                    loading: false,
                    resources: this.props.customSort(response),
                    last_query: clone(query),
                });
            });
        },
        refresh: function(force) {
            let query = this.generateQuery(this.props);
            this.fetch(query);
        },
        componentDidMount: function() {
            this.refresh();
        },
        componentWillReceiveProps: function(next_props) {
            if (!this.props.will_not_update)
                setTimeout(
                    () => {
                        this.refresh();
                    },
                    0
                );
        },
        delete: function(resource) {
            rest
                .delete(this.props.url + "/" + resource.id, {}, { cache: true })
                .then(() => {
                    this.refresh(true);
                });
        },
        render: function() {
            if (this.state.loading) {
                return React.createElement(this.props.loadingComponent);
            }
            const customProps = {
                resources: this.state.resources,
                loading: this.state.loading,
                delete: this.delete,
            };

            const child_props = merge(true, this.props, customProps);

            return React.createElement(ComponentClass, child_props);
        },
    });
}
