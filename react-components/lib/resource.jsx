const React = require("react");
const CachedHttp = require("./cached-http.js");

module.exports = (
	{ collection, get_forced_filter = () => {}, get_forced_format = () => {} },
	component
) =>
	class Resource extends React.Component {
		constructor() {
			super();
			this.state = {
				loading: true,
				resource: null,
			};
		}
		componentDidMount() {
			CachedHttp.get(
				`/api/v1/collections/${collection}/${this.props.id}`,
				{
					filter: Object.assign({}, get_forced_filter(this.props)),
					format: get_forced_format(this.props),
				}
			).then(resource => this.setState({ loading: false, resource }));
		}
		render() {
			if (!this.props.id) {
				throw Error("Please provide the resource id as an 'id' prop");
			}
			return React.createElement(component, {
				resource: this.state.resource,
				loading: this.state.loading,
			});
		}
	};
