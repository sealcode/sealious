import * as Sealious from "../main";
import Hapi from "hapi";

import handle_request from "./handle-request.js";
import get_request_body from "./get-request-body.js";
import extract_context from "./extract-context.js";
import handle_response from "./handle-response.js";
import handle_error from "./handle-error.js";
import { ChipTypeName } from "../app/chip-manager";

const ONE_DAY = 24 * 60 * 60 * 1000;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default class HttpServer {
	name: "www-serer";
	type_name: ChipTypeName = "channel";
	server: Hapi.Server;
	config: {
		port: number;
		"session-cookie-name": string;
		"anonymous-cookie-name": string;
		"max-payload-bytes": number;
		"api-base": string;
	};
	app: Sealious.App;
	custom_raw_route: Function;
	constructor(app: Sealious.App) {
		this.config = app.ConfigManager.get("www-server");
		this.server = new Hapi.Server({ port: this.config.port });
		this.app = app;

		this.server.state(this.config["session-cookie-name"], {
			ttl: ONE_DAY,
			path: "/",
			isSecure: false,
		});

		this.server.state(this.config["anonymous-cookie-name"], {
			ttl: ONE_DAY,
			path: "/",
			isSecure: false,
		});

		this.custom_raw_route = this.server.route.bind(this.server);
	}

	async start() {
		await this.server.register(require("inert"));
		const rest_url_base = this.config["api-base"];
		const path = `${rest_url_base}/{elements*}`;

		this.server.route({
			method: ["GET", "DELETE"],
			path: path,
			handler: handle_request.bind({}, this.app),
		});

		this.server.route({
			method: ["PATCH", "PUT", "POST"],
			path: path,
			config: {
				payload: {
					multipart: {
						output: "annotated",
					},
					maxBytes: this.config["max-payload-bytes"],
				},
				handler: handle_request.bind({}, this.app),
			},
		});

		const routes = require("./routes/routes.js");
		for (let route_name in routes) {
			routes[route_name](this.app);
		}
		await this.server.start();
		this.app.Logger.info(
			`app running. URL set in manifest: ${this.app.manifest.base_url}`
		);
	}

	async custom_route(
		method: HttpMethod,
		path: string,
		handler: (
			app: Sealious.App,
			context: Sealious.Context,
			body: any
		) => Promise<any>
	) {
		await this.server.register(require("inert"));

		this.server.route({
			method: method,
			path: path,
			handler: async function (request: any, h: any) {
				let context = null;
				try {
					context = await extract_context(this.app, request);
					const body = get_request_body(context, request);
					const result = await handler(this.app, context, body);
					return handle_response(this.app, context, h)(result);
				} catch (e) {
					return handle_error(this.app, h)(e);
				}
			},
		});
	}

	static_route(local_path: string, public_path: string) {
		this.server.register(require("inert"));
		this.server.route({
			method: "GET",
			path: `${public_path}/{param*}`,
			handler: {
				directory: {
					path: local_path,
				},
			},
		});
	}

	stop() {
		return this.server.stop();
	}
}
