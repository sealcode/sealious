const React = require("react");
const merge = require("merge");

module.exports = function(store, store_prop_name, component) {
	return class extends React.Component {
		constructor(props) {
			super(props);
			this.state = { [store_prop_name]: {} };
		}
		componentDidMount() {
			const self = this;
			const listener = function(value) {
				self.setState({ [store_prop_name]: value });
			};
			store.on("change", listener);
			self.setState({
				listener: listener,
				[store_prop_name]: store.getStore(),
			});
		}
		componentWillUnmount() {
			const self = this;
			(store.off || store.removeListener).bind(store)(
				"change",
				self.state.listener
			);
		}
		render() {
			return React.createElement(
				component,
				Object.assign({}, this.props, {
					[store_prop_name]: this.state[store_prop_name],
				})
			);
		}
	};
};
