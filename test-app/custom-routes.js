const path = require("path");

module.exports = App => {
	const www_server = App.ChipManager.get_chip("channel", "www-server");

	www_server.static_route(path.resolve(module.filename, "../public"), "");
};
