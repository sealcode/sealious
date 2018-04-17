"use strict";
const stream = require("stream");
const http = require("http");
const Promise = require("bluebird");
const Sealious = require("../../lib/main");
const Hapi = require("hapi");
const Boom = require("boom");
const merge = require("merge");

const handle_request = require("./handle-request.js");
const get_request_body = require("./get-request-body.js");
const extract_context = require("./extract-context.js");
const handle_response = require("./handle-response.js");
const handle_error = require("./handle-error.js");

module.exports = function(App) {
	const channel = App.createChip(Sealious.Channel, { name: "www-server" });
	const config = App.ConfigManager.get("www-server");
	const server = new Hapi.Server();
	server.connection({ port: config.port });

	const rest_url_base = config["api-base"];

	const path = `${rest_url_base}/{elements*}`;

	server.state(config["session-cookie-name"], {
		ttl: 24 * 60 * 60 * 1000, // One day
		path: "/",
		isSecure: false,
	});

	server.state(config["anonymous-cookie-name"], {
		ttl: 24 * 60 * 60 * 1000, // One day
		path: "/",
		isSecure: false,
	});

	server.register(require("inert"), function() {
		server.route({
			method: ["GET", "DELETE"],
			path: path,
			handler: handle_request.bind({}, App),
		});

		server.route({
			method: ["PATCH", "PUT", "POST"],
			path: path,
			config: {
				payload: {
					multipart: {
						output: "annotated",
					},
					maxBytes: config["max-payload-bytes"],
				},
				handler: handle_request.bind({}, App),
			},
		});
	});

	channel.static_route = function(local_path, public_path) {
		server.register(require("inert"), function() {
			server.route({
				method: "GET",
				path: "/{param*}",
				handler: {
					directory: {
						path: local_path,
					},
				},
			});
		});
	};

	channel.custom_route = function(method, path, handler) {
		server.register(require("inert"), function() {
			server.route({
				method: method,
				path: path,
				handler: function(request, reply) {
					let context = null;

					return extract_context(App, request)
						.then(function(_context) {
							context = _context;
							return get_request_body(context, request);
						})
						.then(function(body) {
							return handler(App, context, body);
						})
						.then(result =>
							handle_response(App, context, reply)(result)
						)
						.catch(result => handle_error(App, reply)(result));
				},
			});
		});
	};

	channel.custom_raw_route = server.route.bind(server);

	channel.start = function() {
		const routes = require("./routes/routes.js");
		for (let route_name in routes) {
			routes[route_name](App);
		}
		return new Promise(function(resolve, reject) {
			server.start(function(err) {
				if (err) {
					throw err;
				}
				App.Logger.info(
					`App running. URL set in manifest: ${App.manifest.base_url}`
				);
				resolve();
			});
		});
	};

	channel.stop = function() {
		return server.stop();
	};

	return channel;
};
