import { App, ActionName } from "../main";

// @ts-ignore
const locreq = require("locreq")(__dirname);
import axios from "axios";
import tough from "tough-cookie";
import { Environment } from "../app/config";
import SealiousResponse from "../../common_lib/response/sealious-response";
import { EventMatcher } from "../app/event-matchers";
import {
	CollectionResponse,
	SingleItemResponse,
} from "../../common_lib/response/responses";

type TestCallback = (params: CallbackParams) => Promise<any>;

export async function withStoppedApp(cb: TestCallback): Promise<any> {
	await withTestApp("auto_start" && false, "dev", cb);
}

export async function withRunningApp(cb: TestCallback): Promise<any> {
	await withTestApp("auto_start" && true, "dev", cb);
}

export async function withRunningAppProd(cb: TestCallback): Promise<any> {
	await withTestApp("auto_start" && true, "production", cb);
}

export async function withStoppedAppProd(cb: TestCallback) {
	await withTestApp.bind("auto_start" && false, "production", cb);
}

export type MockRestApi = {
	get: Function;
	getSealiousResponse: (
		url: string,
		body?: { [field: string]: any }
	) => Promise<SealiousResponse>;
	delete: Function;
	patch: Function;
	post: Function;
	login: Function;
};

type CallbackParams = {
	app: App;
	base_url: string;
	smtp_api_url: string;
	rest_api: MockRestApi;
	mail_api: {
		getMessages: () => Promise<
			{
				recipients: string[];
				subject: string;
				id: number;
				sender: string;
			}[]
		>;
		getMessageById: (id: number) => Promise<string>;
	};
	dontClearDatabaseOnStop: () => void;
};

async function withTestApp(
	auto_start: boolean,
	env: Environment,
	fn: (params: CallbackParams) => Promise<any>
) {
	const port = 8888;
	const base_url = `http://localhost:${port}`;
	const smtp_api_url = "http://mailcatcher:1080";

	const app = new App(
		{
			upload_path: "/tmp",
			datastore_mongo: { host: "db", password: "sealious-test" },
			smtp: {
				host: "mailcatcher",
				port: 1025,
				user: "any",
				password: "any",
			},
			email: {
				from_name: "Sealious test app",
				from_address: "sealious@example.com",
			},
			core: { environment: env },
			app: { version: "0.0.0-test" },
			logger: { level: "emerg" },
			"www-server": {
				port,
			},
			password_hash: {
				iterations: 1,
			},
		},
		{
			name: "testing app",
			logo: locreq.resolve("src/assets/logo.png"),
			default_language: "pl",
			version: "0.0.0-test",
			base_url,
			colors: {
				primary: "#4d394b",
			},
			admin_email: "admin@example.com",
		}
	);

	const possible_actions: ActionName[] = ["create", "show", "edit", "delete"];

	const debug_matcher = (when: "before" | "after") =>
		new EventMatcher({
			when: when,
			action: possible_actions,
			subject_path: /.*/,
		});

	app.addHook(debug_matcher("after"), async () =>
		app.Logger.debug(arguments)
	);

	app.addHook(debug_matcher("before"), async () =>
		app.Logger.debug(arguments)
	);

	let clear_database_on_stop = true;

	app.on("stopping", async () => {
		if (clear_database_on_stop && app.Datastore.db) {
			for (const collection_name in app.collections) {
				await app.Datastore.remove(
					collection_name,
					{},
					"just_one" && false
				);
			}
			await app.Datastore.remove(
				app.Metadata.db_collection_name,
				{},
				"just_one" && false
			);
		}
	});

	if (auto_start) {
		await app.start();
	}

	try {
		await axios.delete(`${smtp_api_url}/messages`);

		await fn({
			app,
			base_url,
			smtp_api_url,
			mail_api: {
				getMessages: async () =>
					(await axios.get(`${smtp_api_url}/messages`)).data,
				getMessageById: async (id: number) =>
					(await axios.get(`${smtp_api_url}/messages/${id}.html`))
						.data as string,
			},
			dontClearDatabaseOnStop: () => (clear_database_on_stop = false),
			rest_api: {
				get: async (
					url: string,
					options: Parameters<typeof axios.get>[1]
				) => (await axios.get(`${base_url}${url}`, options)).data,
				getSealiousResponse: async (url, options) => {
					const resp = (await axios.get(`${base_url}${url}`, options))
						.data;
					return resp.items
						? new CollectionResponse(resp)
						: new SingleItemResponse(resp);
				},
				delete: async (
					url: string,
					options: Parameters<typeof axios.delete>[1]
				) => (await axios.delete(`${base_url}${url}`, options)).data,
				patch: async (
					url: string,
					data: any,
					options: Parameters<typeof axios.patch>[1]
				) =>
					(await axios.patch(`${base_url}${url}`, data, options))
						.data,
				post: async (
					url: string,
					data: any,
					options: Parameters<typeof axios.post>[2]
				) =>
					(await axios.post(`${base_url}${url}`, data, options)).data,
				login: async ({
					username,
					password,
				}: {
					username: string;
					password: string;
				}) => {
					const cookie_jar = new tough.CookieJar();
					const options = {
						jar: cookie_jar,
						withCredentials: true,
					};
					await axios.post(
						`${base_url}/api/v1/sessions`,
						{
							username,
							password,
						},
						options
					);
					return options;
				},
			},
		});
	} catch (e) {
		console.error(e);
		throw e;
	} finally {
		if (app.status !== "stopped") {
			await app.stop();
		}
	}
}
