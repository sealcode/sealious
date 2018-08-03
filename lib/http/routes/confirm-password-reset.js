const assert = require("assert");
const locreq = require("locreq")(__dirname);
const fs = require("fs");

let css;
let get_css = async () => {
	if (!css) {
		css = await new Promise((resolve, reject) => {
			fs.readFile(
				locreq.resolve("lib/assets/vertical-rhythm.css"),
				(err, data) => {
					if (err) reject(err);
					else resolve(data);
				}
			);
		});
	}
	return css;
};

let render_form = async (app, token, email) => `
<!DOCTYPE html>
<html>
<style>
${await get_css()}
html {
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
.reveal-button{
	margin-left: -.5rem;
}
</style>
<meta charset="utf-8">
<title>${app.i18n("password_reset_cta")}</title>
<img src="/api/v1/logo" alt="${app.manifest.name} - logo"/>
<h1>${app.i18n("password_reset_cta")}</h1>
<form method="POST" action="/finalize-password-reset">
<input type="hidden" name="token" value="${token}"/>
<input type="hidden" name="email" value="${email}"/>
<fieldset>
<legend>${app.i18n("password_reset_input_cta", email)}</legend>
	<input id="pwd" name="password" type="password" size="32"/>
	<button id="reveal" class="reveal-button" onclick="toggle(event)" title="${app.i18n(
		"reveal_password"
	)}" >🙈</button>
    <br/>
    <input type="submit" value="${app.i18n("password_reset_cta")}"/>
</fieldset>
</form>
<script>
function toggle(event){
    event.preventDefault();
	if(pwd.type=="password"){
		pwd.type="text";
        reveal.textContent="👀";
	}else{
		pwd.type="password";
        reveal.textContent="🙈";
    }
    return null;
}
</script>
</html>
`;

module.exports = app => {
	app.WwwServer.custom_route(
		"GET",
		"/confirm-password-reset",
		async (app, context, params) => {
			assert(params.token);
			assert(params.email);
			return new app.Sealious.VirtualFile(
				await render_form(app, params.token, params.email),
				"text/html"
			);
		}
	);
};
