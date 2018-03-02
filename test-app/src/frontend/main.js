import React from "react";
import { render } from "react-dom";

import { propsFromUrl } from "sealious-react-components";

const view_to_component = {
	main: require("./components/Main/Main.jsx").default,
	navigation: require("./components/Navbar/Navbar.jsx").default,
	login: require("./components/Login/Login.jsx").default,
};

const make_permanent_elements = props =>
	[React.createElement(view_to_component.navigation, props)].map(
		(Element, i) => React.cloneElement(Element, { key: i })
	);

const component_exists = ({ view }) => view_to_component.hasOwnProperty(view);

const RenderView = props => (
	<div className="main-container">
		{make_permanent_elements(props)}
		<div className={`content content-${props.view || ""}`}>
			{React.createElement(
				component_exists(props)
					? view_to_component[props.view]
					: view_to_component.main
			)}
		</div>
	</div>
);

render(
	React.createElement(propsFromUrl(RenderView)),
	document.getElementById("app")
);
