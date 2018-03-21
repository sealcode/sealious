const Promise = require("bluebird");
module.exports = Promise.promisify((delay, callback) =>
	setTimeout(callback, delay)
);
