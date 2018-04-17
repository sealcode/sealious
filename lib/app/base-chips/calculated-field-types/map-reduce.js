const Promise = require("bluebird");

module.exports = function(App) {
	return {
		name: "map-reduce",
		calculate: function(context, params, item) {
			const action_arguments = [
				context,
				params.source.subject_path,
				params.source.action_name,
				params.source.params,
			].map(function(element) {
				if (element instanceof Function) {
					return element(context, params, item);
				} else {
					return element;
				}
			});
			return Promise.all(action_arguments)
				.then(function(fulfilled_action_arguments) {
					return App.run_action.apply(
						App,
						fulfilled_action_arguments
					);
				})
				.map(params.map)
				.reduce(params.reduce[0], params.reduce[1]);
		},
	};
};
