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

module.exports = function(app) {
	const channel = app.createChip(Sealious.Channel, { name: "www-server" });
	const config = app.ConfigManager.get("www-server");
	const server = new Hapi.Server({ port: config.port });

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

	channel.static_route = function(local_path, public_path) {
		server.register(require("inert"));
		server.route({
			method: "GET",
			path: "/{param*}",
			handler: {
				directory: {
					path: local_path,
				},
			},
		});
	};

	channel.custom_route = async function(method, path, handler) {
		await server.register(require("inert"));

		server.route({
			method: method,
			path: path,
			handler: function(request, h) {
				let context = null;

				return extract_context(app, request)
					.then(function(_context) {
						context = _context;
						return get_request_body(context, request);
					})
					.then(function(body) {
						return handler(app, context, body);
					})
					.then(result => handle_response(app, context, h)(result))
					.catch(result => handle_error(app, h)(result));
			},
		});
	};

	channel.custom_raw_route = server.route.bind(server);

	channel.start = async function() {
		await server.register(require("inert"));

		server.route({
			method: ["GET", "DELETE"],
			path: path,
			handler: handle_request.bind({}, app),
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
				handler: handle_request.bind({}, app),
			},
		});

		const routes = require("./routes/routes.js");
		for (let route_name in routes) {
			routes[route_name](app);
		}
		await server.start();
		app.Logger.info(
			`app running. URL set in manifest: ${app.manifest.base_url}`
		);
	};

	channel.stop = function() {
		return server.stop();
	};

	return channel;
};
