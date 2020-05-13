"use strict";
const error_to_boom = require("./error-to-boom.js");

module.exports = function(app, h) {
	return function(error) {
		app.Logger.error(error);
		if (error instanceof app.Sealious.Error && error.is_user_fault) {
			return error_to_boom(error);
		} else {
			return error;
		}
	};
};
