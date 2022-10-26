import assert from "assert";
import { Collection, FieldTypes, SuperContext } from "../../../main";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { TestApp } from "../../../test_utils/test-app";
import { TestAppConstructor, withRunningApp } from "../../../test_utils/with-test-app";
import type { UrlParams } from "./url";

const create_app_with_url = (test_app: TestAppConstructor<TestApp>, params: UrlParams) => {
	const website = new (class extends Collection {
		fields = {
			url: new FieldTypes.Url(params),
		};
	})();

	return class extends test_app {
		collections = {
			...TestApp.BaseCollections,
			website,
		};
	};
};

describe("url", () => {
	it("should be able to create any url when no options provided", async () => {
		return withRunningApp(
			(test_app) => create_app_with_url(test_app, {}),
			async ({ app }) => {
				const wb = await app.collections.website.create(new SuperContext(app), {
					url: "https://example.com/",
				});

				assert.strictEqual("https://example.com/", wb.get("url"));
			}
		);
	});

	it("should throw exception when domain is not allowed", async () => {
		return withRunningApp(
			(test_app) =>
				create_app_with_url(test_app, { allowed_origins: ["https://www.youtube.com"] }),
			async ({ app }) => {
				await assertThrowsAsync(async () => {
					await app.collections.website.create(new SuperContext(app), {
						url: "https://example.com/",
					});
				});
			}
		);
	});

	it("should throw exception when protocol is not allowed", async () => {
		return withRunningApp(
			(test_app) => create_app_with_url(test_app, { allowed_protocols: ["https"] }),
			async ({ app }) => {
				await assertThrowsAsync(async () => {
					await app.collections.website.create(new SuperContext(app), {
						url: "http://example.com/",
					});
				});
			}
		);
	});
});
