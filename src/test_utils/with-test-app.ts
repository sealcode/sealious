import Router from "@koa/router";
import getPort from "get-port";
import { default as Koa } from "koa";
import installQS from "koa-qs";
import { v4 as uuid } from "uuid";
import type { Environment } from "../app/config.js";
import handleError from "../http/handle-error.js";
import MailcatcherAPI from "./mailcatcher.js";
import MockRestApi from "./rest-api.js";
import { TestApp } from "./test-app.js";

export type TestAppConstructor<T extends TestApp = TestApp> = new (
	uniq_id: string,
	env: Environment,
	port: number,
	base_url: string
) => T;

type CallbackParams<FinalTestAppType extends TestApp> = {
	app: FinalTestAppType;
	base_url: string;
	smtp_api_url: string;
	rest_api: MockRestApi;
	port: number;
	mail_api: MailcatcherAPI;
	app_class: TestAppConstructor<TestApp>;
	uniq_id: string;
	env: Environment;
	router: Router;
};

type TestCallback<FinalTestAppType extends TestApp> = (
	params: CallbackParams<FinalTestAppType>
) => Promise<unknown>;

type extendFn<FinalTestAppType extends TestApp> =
	| null
	| ((
			app_class: TestAppConstructor<TestApp>
	  ) => TestAppConstructor<FinalTestAppType>);

const test_collections: { [collection: string]: string } = {};

export async function withStoppedApp<FinalTestAppType extends TestApp>(
	extend_fn: extendFn<FinalTestAppType>,
	cb: TestCallback<FinalTestAppType>,
	test_collection?: string // tests with the same collection get assigned the same db id
): Promise<any> {
	await withTestApp(false, "dev", extend_fn, cb, test_collection);
}

export async function withRunningApp<FinalTestAppType extends TestApp>(
	extend_fn: extendFn<FinalTestAppType>,
	cb: TestCallback<FinalTestAppType>,
	test_collection?: string // tests with the same collection get assigned the same db id
): Promise<any> {
	await withTestApp(true, "dev", extend_fn, cb, test_collection);
}

function getAppID(test_collection?: string) {
	let uniq_id;
	if (test_collection) {
		if (!test_collections[test_collection]) {
			test_collections[test_collection] = uuid();
		}
		uniq_id = test_collections[test_collection];
	} else {
		uniq_id = uuid();
	}
	return uniq_id;
}

export async function withTestApp<FinalTestAppType extends TestApp>(
	auto_start: boolean,
	env: Environment,
	extend_fn: extendFn<FinalTestAppType>,
	fn: (params: CallbackParams<FinalTestAppType>) => Promise<unknown>,
	test_collection?: string
): Promise<void> {
	const port = await getPort();
	const base_url = `http://127.0.0.1:${port}`;
	const smtp_api_url = `http://${
		process.env.SEALIOUS_SMTP_HOST || "127.0.0.1"
	}:1088`;

	const constructor = extend_fn ? extend_fn(TestApp) : TestApp;
	const uniq_id = getAppID(test_collection);
	if (!uniq_id || !env || !port || !base_url) {
		throw new Error("uniq_id, env, port, or base_url is missing.");
	}
	const test_app = new constructor(uniq_id, env, port, base_url);
	const router = new Router();
	const koa_app = new Koa();
	installQS(koa_app);
	koa_app.use(handleError());
	koa_app.use(router.routes());
	koa_app.context.$app = test_app;
	const server = koa_app.listen(port);
	test_app.on("started", () => {
		test_app.initRouter(router);
	});

	try {
		if (auto_start) {
			await test_app.start();
		}
		await fn({
			app: test_app as FinalTestAppType,
			port,
			app_class: constructor,
			env,
			base_url,
			uniq_id,
			smtp_api_url,
			mail_api: new MailcatcherAPI(smtp_api_url, test_app),
			rest_api: new MockRestApi(base_url),
			router,
		});
	} catch (e) {
		console.error(e);
		throw e;
	} finally {
		if (test_app.status !== "stopped") {
			await test_app.stop();
		}
		server.close();
	}
}
