const React = require("react");
const axios = require("axios");

function GetCustomResource(component, url) {
	return class GetCustomResourceComponent extends React.Component {
		constructor(props) {
			super(props);

			this.component = component;
			this.url = url;

			this.state = {
				resource: null,
				loading: false,
				error: null,
			};
		}

		async componentDidMount() {
			this.setState({ loading: true });
			try {
				const response = await axios.get(this.url);
				this.setState({ resource: response.data, loading: false });
			} catch (error) {
				this.setState({ loading: false, error: error });
			}
		}

		render() {
			return React.createElement(this.component, { ...this.state });
		}
	};
}

module.exports = GetCustomResource;
