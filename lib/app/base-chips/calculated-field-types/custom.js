"use strict";
const Promise = require("bluebird");

module.exports = function(app) {
	return {
		name: "custom",
		calculate: function(context, params, item, db_document) {
			return params(app, context, item, db_document);
		},
	};
};
