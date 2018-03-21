const assert = require("assert");

module.exports = async function assertThrowsAsync(fn, regExp) {
	let f = () => {};
	try {
		await fn();
	} catch (e) {
		f = () => {
			throw e;
		};
	} finally {
		assert.throws(f, regExp);
	}
};
