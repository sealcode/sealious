const assert = require("assert");

module.exports = async function assertThrowsAsync(fn, error_handler) {
	let f = () => {};
	let error = null;
	try {
		await fn();
	} catch (e) {
		error = e;
	} finally {
		assert.notStrictEqual(error, null, "It didn't throw");
		await error_handler(error);
	}
};
