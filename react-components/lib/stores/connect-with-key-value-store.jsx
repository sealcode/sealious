const React = require("react");
const merge = require("merge");

module.exports = function(store, store_prop_name, component) {
    return React.createClass({
        getInitialState: function() {
            return { [store_prop_name]: {} };
        },
        componentDidMount: function() {
            const self = this;
            const listener = function(value) {
                self.setState({ [store_prop_name]: value });
            };
            store.on("change", listener);
            self.setState({
                listener: listener,
                [store_prop_name]: store.getStore(),
            });
        },
        componentWillUnmount: function() {
            const self = this;
            store.off("change", self.state.listener);
        },
        render: function() {
            return React.createElement(
                component,
                merge(true, this.props, {
                    [store_prop_name]: this.state[store_prop_name],
                })
            );
        },
    });
};
