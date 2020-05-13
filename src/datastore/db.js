const Datastore = require("./datastore.js");

module.exports = function() {
	return new Datastore({
		name: "mongo",
	});
};
