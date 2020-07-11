import * as assert from "assert";
// @ts-ignore
const locreq = require("locreq")(__dirname);
import fs from "fs";
import App from "../../app/app";
import { File } from "../../main";

let css: string;
let get_css = async () => {
	if (!css) {
		css = await fs.promises.readFile(
			locreq.resolve("src/assets/vertical-rhythm.css"),
			"utf-8"
		);
	}
	return css;
};

let render_form = async (app: App, token: string, email: string) => /* HTML */ `
	<!DOCTYPE html>
	<html>
		<style>
			${await get_css()} html {
				background-color: #edeaea;
			}
			body {
				max-width: 21cm;
				margin: 1cm auto;
				font-family: sans-serif;
				background-color: white;
				padding: 1cm;
				box-sizing: border-box;
			}
			.reveal-button {
				margin-left: -0.5rem;
			}
		</style>
		<meta charset="utf-8" />
		<title>${app.i18n("password_reset_cta")}</title>
		<img src="/api/v1/logo" alt="${app.manifest.name} - logo" />
		<h1>${app.i18n("password_reset_cta")}</h1>
		<form method="POST" action="/finalize-password-reset">
			<input type="hidden" name="token" value="${token}" />
			<input type="hidden" name="email" value="${email}" />
			<fieldset>
				<legend>${app.i18n("password_reset_input_cta", email)}</legend>
				<input id="pwd" name="password" type="password" size="32" />
				<button
					id="reveal"
					class="reveal-button"
					onclick="toggle(event)"
					title="${app.i18n("reveal_password")}"
				>
					🙈
				</button>
				<br />
				<input
					type="submit"
					value="${app.i18n("password_reset_cta")}"
				/>
			</fieldset>
		</form>
		<script>
			function toggle(event) {
				event.preventDefault();
				if (pwd.type == "password") {
					pwd.type = "text";
					reveal.textContent = "👀";
				} else {
					pwd.type = "password";
					reveal.textContent = "🙈";
				}
				return null;
			}
		</script>
	</html>
`;

export default (app: App) => {
	app.HTTPServer.custom_route(
		"GET",
		"/confirm-password-reset",
		async (app, _, params) => {
			assert.ok(params.token);
			assert.ok(params.email);
			const file = await File.fromData(
				app,
				await render_form(app, params.token, params.email)
			);
			file.filename = "confirm-password.html"; // to set the mimetype
			return file;
		}
	);
};
