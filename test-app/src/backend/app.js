const Sealious = require("../../../sealious/lib/main");

const App = new Sealious.App();

require("../../custom-routes")(App);

const dependencies = [
	"collections/users.js",
	"collections/regular-single-reference.js",
	"collections/filter-single-reference.js",
];

dependencies.forEach(dependency => require(`./${dependency}`)(App));

module.exports = {
	start: () => App.start(),
	_app: App,
};
