const React = require("react");
const SingleResourceAPI = require("./api/single-resource-api.js");

module.exports = (
	{
		collection,
		get_forced_filter = () => {},
		get_forced_format = () => {},
		get_id = props => props.id,
		resource_api_class = SingleResourceAPI,
	},
	component
) =>
	class Resource extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				resourceAPI: null,
				resourceData: null,
			};
		}
		componentDidMount() {
			const resourceAPI = new resource_api_class(
				collection,
				get_id(this.props),
				{
					filter: Object.assign({}, get_forced_filter(this.props)),
					format: get_forced_format(this.props),
				}
			);
			this.setState({ resourceAPI });
			resourceAPI.on("change", newData => {
				this.setState({ resourceData: newData });
			});
			resourceAPI.load();
		}
		componentWillUnmount() {
			if (this.state.resourceAPI !== null) {
				this.state.resourceAPI.removeAllListeners();
			}
		}
		isLoading() {
			return (
				this.state.resourceAPI === null ||
				this.state.resourceAPI.loading
			);
		}
		render() {
			if (!get_id(this.props)) {
				throw Error(
					"Please provide the resource id as an 'id' prop or provide the 'get_id' prop"
				);
			}
			return React.createElement(
				component,
				Object.assign({}, this.props, {
					loading: this.isLoading(),
					resourceAPI: this.state.resourceAPI,
					resourceData: this.state.resourceData,
				})
			);
		}
	};
