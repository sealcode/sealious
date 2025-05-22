import { default as Koa } from "koa";
import Static from "koa-static";
import Router from "@koa/router";
import type { Server } from "http";
import mount from "koa-mount";
import installQS from "koa-qs";
import handleError from "./handle-error.js";
import type { App } from "../main.js";

export default class HttpServer {
	name: "www-serer";
	private server: Server;

	koa: Koa;
	router: Router;
	config: {
		port: number;
		"session-cookie-name": string;
		"max-payload-bytes": number;
		"api-base": string;
	};

	constructor(public app: App) {
		this.koa = new Koa();
		installQS(this.koa);

		this.koa.context.$app = this.app;

		this.router = new Router();

		// const rest_url_base = this.config["api-base"];
	}

	async start(): Promise<void> {
		this.koa.use(handleError());
		this.koa.use(this.router.routes());
		this.config = this.app.ConfigManager.get("www-server");
		this.server = this.koa.listen(this.config.port);

		this.app.Logger.info(
			"STARTED",
			`App running. URL set in manifest: ${this.app.manifest.base_url}`
		);
	}

	async stop(): Promise<void> {
		this.server?.close();
	}

	addStaticRoute(url_path: string, local_path: string): void {
		this.koa.use(mount(url_path, Static(local_path)));
	}
}
