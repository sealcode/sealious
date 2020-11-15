import axios from "axios";
import { withRunningApp } from "../../test_utils/with-test-app";

describe("confirm-password-reset", () => {
	it("displays an html form", async () =>
		withRunningApp(null, async ({ base_url }) => {
			await axios.get(
				`${base_url}/confirm-password-reset?token=kupcia&email=dupcia`
			);
		}));
});
