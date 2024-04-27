import assert from "assert";
import locreq_curry from "locreq";
import { module_dirname } from "../utils/module_filename.js";
import { FileManager } from "./file-manager.js";
const locreq = locreq_curry(module_dirname(import.meta.url));

describe("file manager", () => {
	it("shows the original filename for a variety of file origins", async () => {
		const file_manager = new FileManager("/tmp");
		const file_from_path = file_manager.fromPath(
			locreq.resolve("src/assets/logo.png")
		);

		const file_from_path_with_changed_name = file_manager.fromPath(
			locreq.resolve("src/assets/logo.png"),
			"logo.jpg"
		);

		const file_from_data = file_manager.fromData(
			Buffer.from("ABC"),
			"file.txt"
		);

		const token = await file_from_path.save(false);
		const file_from_token = await file_manager.fromToken(token);

		assert.deepStrictEqual(
			await Promise.all(
				[
					file_from_path,
					file_from_path_with_changed_name,
					file_from_data,
					file_from_token,
				].map((f) => f.getOriginalFilename())
			),
			["logo.png", "logo.jpg", "file.txt", "logo.png"]
		);
	});
});
