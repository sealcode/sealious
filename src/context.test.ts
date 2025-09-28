import { withRunningApp, withStoppedApp } from "./test_utils/with-test-app.js";
import { default as Context } from "./context.js";
import assert from "assert";
import extract_context from "./http/extract-context.js";
import { sleep } from "./test_utils/sleep.js";

describe("context", () => {
	it("Exposes user roles in getRoles() method", async () => {
		return withRunningApp(
			(t) => {
				return t;
			},
			async ({ app }) => {
				const user = await app.collections.users.create(
					new app.SuperContext(),
					{
						username: "admin",
						password: "password",
						roles: [{ role: "admin" }],
					}
				);
				const context = new Context({ app, user_id: user.id });
				assert.deepStrictEqual(await context.getRoles(), ["admin"]);
			}
		);
	});

	describe("i18n", () => {
		it("uses the string verbatim if there are no translations", () =>
			withStoppedApp(
				(t) => t,
				async ({ app }) => {
					const context = new app.Context();
					assert.strictEqual(
						context.i18n`Some random ${"value"}`,
						"Some random value"
					);
				}
			));

		it("uses the translated version if it's available", () =>
			withStoppedApp(
				(t) => t,
				async ({ app }) => {
					const context = new app.Context({
						accepted_languages: ["pl"],
					});
					app.addTranslations({
						pl: {
							"Some random {}": (value) =>
								`Jakaś losowa ${value}`,
						},
					});
					assert.strictEqual(
						context.i18n`Some random ${"value"}`,
						"Jakaś losowa value"
					);
				}
			));

		it("uses some other accepted language if the first one does not have the translation", () =>
			withStoppedApp(
				(t) => t,
				async ({ app }) => {
					const context = new app.Context({
						accepted_languages: ["de", "pl"],
					});
					app.addTranslations({
						pl: {
							"Some random {}": (value) =>
								`Jakaś losowa ${value}`,
						},
					});
					assert.strictEqual(
						context.i18n`Some random ${"value"}`,
						"Jakaś losowa value"
					);
				}
			));

		it("uses the verbatim string if there are no translations in any of the languages", () =>
			withStoppedApp(
				(t) => t,
				async ({ app }) => {
					const context = new app.Context({
						accepted_languages: ["de", "pl"],
					});
					assert.strictEqual(
						context.i18n`Some random ${"value"}`,
						"Some random value"
					);
				}
			));

		it("parses the headers and responds with the best available translation", () =>
			withStoppedApp(
				(t) => t,
				async ({ base_url, app, router }) => {
					app.addTranslations({
						pl: {
							"Some random {}": (value) =>
								`Jakaś losowa ${value}`,
						},
					});
					router.get("/text", extract_context(), (ctx) => {
						ctx.body = ctx.$context.i18n`Some random ${"value"}`;
						ctx.status = 200;
					});

					await app.start();

					const url = `${base_url}/text`;
					const response = await fetch(url, {
						headers: {
							"Accept-Language": "pl,de;q=0.8",
						},
					});
					const text = await response.text();
					assert.strictEqual(text, "Jakaś losowa value");
				}
			));

		it("parses the headers and responds with fallback translation if translation is not available", () =>
			withStoppedApp(
				(t) => t,
				async ({ base_url, app, router }) => {
					app.addTranslations({
						pl: {
							"Some random {}": (value) =>
								`Jakaś losowa ${value}`,
						},
					});
					router.get("/text", extract_context(), (ctx) => {
						ctx.body = ctx.$context.i18n`Some random ${"value"}`;
						ctx.status = 200;
					});

					await app.start();

					const url = `${base_url}/text`;
					const response = await fetch(url, {
						headers: {
							"Accept-Language": "de",
						},
					});
					const text = await response.text();
					assert.strictEqual(text, "Some random value");
				}
			));
	});
});
