import { App } from "../app/app.js";
import { withRunningApp } from "../test_utils/with-test-app.js";
import { Collection, FieldTypes } from "../main.js";
import { assertThrowsAsync } from "../test_utils/assert-throws-async.js";
import assert from "assert";

describe("field class", () => {
	describe("transition behavior", () => {
		it("uses the transition checker to allow / disallow certain value changes", () =>
			withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							history: new (class extends Collection {
								fields = {
									timestamp:
										new FieldTypes.Int().setTransitionChecker(
											async (_, old_value, new_value) => {
												return old_value == undefined ||
													new_value > old_value
													? { valid: true }
													: {
															valid: false,
															reason: "timestamps cannot go back in time",
														};
											}
										),
								};
							})(),
						};
					},
				async ({ app }) => {
					const event = await app.collections.history.suCreate({
						timestamp: 0,
					});

					event.set("timestamp", 1);
					await event.save(new app.SuperContext());

					await assertThrowsAsync(async () => {
						event.set("timestamp", 0);
						await event.save(new app.SuperContext());
					});
				}
			));

		it("doesn't call the transition checker if the value didn't change", async () => {
			let call_count = 0;
			await withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...App.BaseCollections,
							history: new (class extends Collection {
								fields = {
									title: new FieldTypes.Text(),
									timestamp:
										new FieldTypes.Int().setTransitionChecker(
											async () => {
												call_count++;
												return {
													valid: true,
												};
											}
										),
								};
							})(),
						};
					},
				async ({ app }) => {
					// one
					const event = await app.collections.history.suCreate({
						timestamp: 0,
					});

					// two
					event.set("timestamp", 1);
					await event.save(new app.SuperContext());

					// but not three
					event.set("title", "hehe");
					await event.save(new app.SuperContext());

					assert.strictEqual(call_count, 2);
				}
			);
		});
	});
});
