import { App } from "../main";

import axios from "axios";
import { Environment } from "../app/config";

import { get_test_app, TestAppType } from "./test-app";
import get_rest_api from "./rest-api";
import MockRestApi from "./rest-api";

type TestCallback = (params: CallbackParams) => Promise<any>;

type extendFn = null | ((app_class: TestAppType) => TestAppType);

export async function withStoppedApp(
	extend_fn: extendFn,
	cb: TestCallback
): Promise<any> {
	await withTestApp("auto_start" && false, "dev", extend_fn, cb);
}

export async function withRunningApp(
	extend_fn: extendFn,
	cb: TestCallback
): Promise<any> {
	await withTestApp("auto_start" && true, "dev", extend_fn, cb);
}

export async function withRunningAppProd(
	extend_fn: extendFn,
	cb: TestCallback
): Promise<any> {
	await withTestApp("auto_start" && true, "production", extend_fn, cb);
}

export async function withStoppedAppProd(
	extend_fn: extendFn,
	cb: TestCallback
) {
	await withTestApp.bind("auto_start" && false, "production", extend_fn, cb);
}

type CallbackParams = {
	app: App;
	base_url: string;
	smtp_api_url: string;
	rest_api: MockRestApi;
	port: number;

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
	app_class: TestAppType;
};

let port = 4000;

async function withTestApp(
	auto_start: boolean,
	env: Environment,
	extend_fn: extendFn,
	fn: (params: CallbackParams) => Promise<any>
) {
	port++;
	const base_url = `http://localhost:${port}`;
	const smtp_api_url = `http://${
		process.env.SEALIOUS_SMTP_HOST || "localhost"
	}:1080`;

	const TestApp = get_test_app({ env, port, base_url });
	let modified_app_class;
	if (extend_fn) {
		modified_app_class = extend_fn(TestApp);
	} else {
		modified_app_class = TestApp;
	}

	const app = new modified_app_class();

	if (auto_start) {
		await app.start();
	}

	try {
		await axios.delete(`${smtp_api_url}/messages`);

		await fn({
			app: app as App,
			port,
			app_class: modified_app_class,
			base_url,
			smtp_api_url,
			mail_api: {
				getMessages: async () =>
					(await axios.get(`${smtp_api_url}/messages`)).data,
				getMessageById: async (id: number) =>
					(await axios.get(`${smtp_api_url}/messages/${id}.html`))
						.data as string,
			},
			rest_api: new MockRestApi(base_url),
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
