const assert = require("assert");
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

let css;
let get_css = async () => {
	if (!css) {
		css = await readFile(
			require.resolve("../../assets/vertical-rhythm.css")
		);
	}
	return css;
};
let render_form = async (app, { token, email }) => `
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
	max-height: 55vh;
	max-width: 100%;
}
</style>
<meta charset="utf-8">
<title>${app.manifest.name} - ${app.i18n("registration_intent_cta")}</title>
<img src="/api/v1/logo" alt="${app.manifest.name} - logo"/>
<h1>${app.i18n("registration_intent_cta")}</h1>
<form method="POST" id="form" action="/finalize-registration-intent" onkeypress="checkSubmit(event)">
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
function checkSubmit(event) {
	if (event.keyCode == 13 && document.activeElement.id != "reveal") {
	  event.preventDefault();
	  document.querySelector("#form").submit();
	}
  }

</script>
</html>
`;

module.exports = (app) => {
	app.WwwServer.custom_route(
		"GET",
		"/account-creation-details",
		async (app, context, { token, email }) => {
			assert.equal(typeof token, "string", "Token must be a string.");
			assert.equal(typeof email, "string", "Email must be a string.");
			return new app.Sealious.VirtualFile(
				await render_form(app, { token, email }),
				"text/html"
			);
		}
	);
};
