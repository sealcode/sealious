import { Middleware } from "@koa/router";
import * as assert from "assert";

import locreq_curry from "locreq";
const locreq = locreq_curry(__dirname);
import fs from "fs";
import App from "../../app/app";

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

const confirmPasswordReset: Middleware = async (ctx) => {
	assert.ok(ctx.request.query.token);
	assert.ok(ctx.request.query.email);

	if (typeof ctx.request.query.token !== "string") {
		throw new Error("Token isn't a string or is missing");
	}
	if (typeof ctx.request.query.email !== "string") {
		throw new Error("Email isn't a string or is missing");
	}
	ctx.body = await render_form(
		ctx.$app,
		ctx.request.query.token,
		ctx.request.query.email
	);
};

export default confirmPasswordReset;
