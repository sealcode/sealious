import React, { PureComponent } from "react";
import { RouterLink } from "sealious-react-components";

export default class Login extends PureComponent {
	render() {
		return (
			<div>
				<h2>Login</h2>
				<RouterLink routeParams={{ view: "main" }}>
					Strona główna
				</RouterLink>
			</div>
		);
	}
}
