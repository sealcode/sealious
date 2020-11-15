import * as Sealious from "../main";
// ignoring this, as hapi will be removed from Sealious as soon as possible
// @ts-ignore
import Hapi from "hapi";

import handle_request from "./handle-request";
import get_request_body from "./get-request-body";
import extract_context from "./extract-context";
import handle_response from "./handle-response";
import handle_error from "./handle-error";
import routes from "./routes/routes";

const ONE_DAY = 24 * 60 * 60 * 1000;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default class HttpServer {
	name: "www-serer";
	server: Hapi.Server;
	config: {
		port: number;
		"session-cookie-name": string;
		"max-payload-bytes": number;
		"api-base": string;
	};
	app: Sealious.App;
	custom_raw_route: Function;
	constructor(app: Sealious.App) {
		this.app = app;
	}

	async start() {
		this.config = this.app.ConfigManager.get("www-server");
		this.server = new Hapi.Server({ port: this.config.port });

		this.server.state(this.config["session-cookie-name"], {
			ttl: ONE_DAY,
			path: "/",
			isSecure: false,
		});

		this.custom_raw_route = this.server.route.bind(this.server);
		await this.server.register(require("inert"));
		const rest_url_base = this.config["api-base"];
		const path = `${rest_url_base}/{elements*}`;
		const self = this;

		this.server.route({
			method: ["GET", "DELETE"],
			path: path,
			//handler: handle_request.bind({}, this.app),
			handler: async function (request: any, h: any) {
				self.app.Logger.info(
					"REQUEST",
					`Received request: ${request.url.pathname}`
				);
				return handle_request(self.app, request, h);
			},
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

		for (let route_name of Object.keys(routes) as (keyof typeof routes)[]) {
			routes[route_name](this.app);
		}
		await this.server.start();
		this.app.Logger.info(
			"STARTED",
			`App running. URL set in manifest: ${this.app.manifest.base_url}`
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
			handler: async (request: any, h: any) => {
				let context = null;
				try {
					context = await extract_context(this.app, request);
					const body = await get_request_body(
						this.app,
						context,
						request
					);
					const result = await handler(this.app, context, body);
					return handle_response(this.app, context, h)(result);
				} catch (e) {
					return handle_error(this.app)(e);
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

	async stop() {
		await this.server.stop();
	}
}
