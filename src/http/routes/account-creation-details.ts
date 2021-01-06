import { Middleware } from "@koa/router";
import * as assert from "assert";
import fs from "fs";
import { promisify } from "util";
import App from "../../app/app";
const readFile = promisify(fs.readFile);

import locreq_curry from "locreq";
const locreq = locreq_curry(__dirname);

let css: string;
let get_css = async () => {
	if (!css) {
		css = await readFile(
			locreq.resolve("src/assets/vertical-rhythm.css"),
			"utf-8"
		);
	}
	return css;
};
let render_form = async (
	app: App,
	{ token, email }: { token: string; email: string }
) => /* HTML */ `
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
			img {
				max-height: 55vh;
				max-width: 100%;
			}
		</style>
		<meta charset="utf-8" />
		<title>
			${app.manifest.name} - ${app.i18n("registration_intent_cta")}
		</title>
		<img src="/api/v1/logo" alt="${app.manifest.name} - logo" />
		<h1>${app.i18n("registration_intent_cta")}</h1>
		<form
			method="POST"
			id="form"
			action="/finalize-registration-intent"
			onkeypress="checkSubmit(event)"
		>
			<input type="hidden" name="token" value="${token}" />
			<fieldset>
				<legend>
					${app.i18n("registration_intent_form_description")}
				</legend>
				<label for="email">
					Email
					<input type="email" disabled id="email" value="${email}" />
				</label>
				<br />
				<label for="username">
					Login
					<input type="text" id="username" name="username" />
				</label>
				<br />
				<label for="pwd">
					${app.i18n("password")}
					<input id="pwd" name="password" type="password" size="32" />
					<button
						id="reveal"
						class="reveal-button"
						onclick="toggle(event)"
						title="${app.i18n("reveal_password")}"
					>
						🙈
					</button>
				</label>
				<br />
				<input
					type="submit"
					value="${app.i18n("registration_intent_cta")}"
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
			function checkSubmit(event) {
				if (
					event.keyCode == 13 &&
					document.activeElement.id != "reveal"
				) {
					event.preventDefault();
					document.querySelector("#form").submit();
				}
			}
		</script>
	</html>
`;

const accountCreationDetails: Middleware = async (ctx) => {
	const token = ctx.query.token;
	const email = ctx.query.email;
	assert.strictEqual(typeof token, "string", "Token must be a string.");
	assert.strictEqual(typeof email, "string", "Email must be a string.");
	ctx.body = await render_form(ctx.$app, {
		token: token as string,
		email: email as string,
	});
};

export default accountCreationDetails;
