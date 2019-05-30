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

const ONE_DAY = 24 * 60 * 60 * 1000;

module.exports = function(app) {
	const channel = app.createChip(Sealious.Channel, { name: "www-server" });
	const config = app.ConfigManager.get("www-server");
	const server = new Hapi.Server({ port: config.port });

	const rest_url_base = config["api-base"];

	const path = `${rest_url_base}/{elements*}`;

	server.state(config["session-cookie-name"], {
		ttl: ONE_DAY,
		path: "/",
		isSecure: false,
	});

	server.state(config["anonymous-cookie-name"], {
		ttl: ONE_DAY,
		path: "/",
		isSecure: false,
	});

	channel.static_route = function(local_path, public_path) {
		server.register(require("inert"));
		server.route({
			method: "GET",
			path: `${public_path}/{param*}`,
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
			handler: async function(request, h) {
				let context = null;
				try {
					context = await extract_context(app, request);
					const body = await get_request_body(context, request);
					const result = await handler(app, context, body);
					return handle_response(app, context, h)(result);
				} catch (e) {
					return handle_error(app, h)(e);
				}
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
