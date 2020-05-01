const Promise = require("bluebird");
const Errors = require("../response/error.js");
const Chip = require("./chip.js");

function AccessStrategyType(app, declaration) {
	if (declaration instanceof AccessStrategyType) {
		return declaration;
	} else if (typeof declaration === "string") {
		return app.ChipManager.get_chip("access_strategy_type", declaration);
	}
	this.declaration = declaration;
	this.checker_function = null;
	this.name = declaration.name;
	this.app = app;
	if (declaration) {
		this.checker_function =
			declaration.checker_function === undefined
				? null
				: declaration.checker_function.bind(this);
	}
}

AccessStrategyType.type_name = "access_strategy_type";

AccessStrategyType.pure = {
	check: async function (declaration, context, params, sealious_response) {
		if (context.is_super) {
			return;
		}

		const is_item_sensitive = await AccessStrategyType.pure.is_item_sensitive(
			declaration,
			params
		);

		if (is_item_sensitive && sealious_response === undefined) {
			return;
		}

		return Promise.method(declaration.checker_function)(
			context,
			params,
			sealious_response
		)
			.then(function (result) {
				if (result === false) {
					return Promise.reject("Access denied");
				}
				return result;
			})
			.catch(function (error) {
				if (typeof error === "string") {
					return Promise.reject(new Errors.BadContext(error));
				}
				return Promise.reject(error);
			});
	},
	is_item_sensitive: async function (declaration, params) {
		if (typeof declaration.item_sensitive === "function") {
			return declaration.item_sensitive(params);
		}
		return Boolean(declaration.item_sensitive);
	},
	getRestrictingQuery: async function (declaration, context, params) {
		if (!declaration.getRestrictingQuery) {
			return [];
		}
		return declaration.getRestrictingQuery(context, params);
	},
};

AccessStrategyType.prototype = {
	check(context, params, sealious_response) {
		return AccessStrategyType.pure.check(
			this.declaration,
			context,
			params,
			sealious_response
		);
	},
	is_item_sensitive(params) {
		return AccessStrategyType.pure.is_item_sensitive(
			this.declaration,
			params
		);
	},
	getRestrictingQuery(context, params) {
		return AccessStrategyType.pure.getRestrictingQuery(
			this.declaration,
			context,
			params
		);
	},
};

module.exports = AccessStrategyType;
