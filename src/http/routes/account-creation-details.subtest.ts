import axios from "axios";
import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";

describe("account-creation-details", () => {
	it("throws when no token/email is present", () =>
		withRunningApp(({ base_url }) =>
			assertThrowsAsync(
				async () => {
					await axios.get(`${base_url}/account-creation-details`);
				},
				(_) => {}
			)
		));
	it("displays an html form after the positive flow", () =>
		withRunningApp(async ({ base_url }) => {
			const resp = await axios.get(
				`${base_url}/account-creation-details?token=oieajgoiea&email=ababab@ok.pl`
			);
			assert.deepEqual(resp.status, 200);
			assert(resp.data.length);
		}));
});
