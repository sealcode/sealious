import React, { PureComponent } from "react";
import { RouterLink } from "sealious-react-components";

export default class Main extends PureComponent {
	render() {
		return (
			<div>
				<h2>Hello, sealious-test-app!</h2>
				<RouterLink routeParams={{ view: "login" }}>
					Zaloguj się
				</RouterLink>
			</div>
		);
	}
}
