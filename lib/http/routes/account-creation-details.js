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
img{
	max-width: 100%;
}
</style>
<meta charset="utf-8">
<title>${app.manifest.name} - ${app.i18n("registration_intent_cta")}</title>
<img src="/api/v1/logo" alt="${app.manifest.name} - logo"/>
<h1>${app.i18n("registration_intent_cta")}</h1>
<form method="POST" action="/finalize-registration-intent">
<input type="hidden" name="token" value="${token}"/>
<fieldset>
<legend>${app.i18n("registration_intent_form_description")}</legend>
	<label for="email">
	   Email
	   <input type="email" disabled id="email" value="${email}"/>
	</label>
	<br/>
	<label for="username">
	   Login
	   <input type="text" id="username" name="username"/>
	</label>
	<br/>
    <label for="pwd">
		${app.i18n("password").capitalize()}
		<input id="pwd" name="password" type="password" size="32"/>
		<button id="reveal" class="reveal-button" onclick="toggle(event)" title="${app.i18n(
			"reveal_password"
		)}" >🙈</button>
    </label>
    <br/>
    <input type="submit" value="${app.i18n("registration_intent_cta")}"/>
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
		"/account-creation-details",
		async (app, context, params) => {
			assert(params.token);
			assert(params.email);
			return new app.Sealious.VirtualFile(
				render_form(app, params.token, params.email),
				"text/html"
			);
		}
	);
};
