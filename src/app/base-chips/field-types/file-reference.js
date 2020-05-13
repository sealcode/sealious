module.exports = function(app) {
	return {
		name: "file_reference",
		is_proper_value: function(context, params, value) {
			return app.Datastore.find("files", { id: value }).then(function(
				results
			) {
				if (results.length === 0) {
					return Promise.reject("Bad file id: " + value);
				} else {
					return Promise.resolve();
				}
			});
		},
		format: function(context, params, file_id, format) {
			if (format === "internal") {
				return app.Datastore.find("files", { id: file_id }).then(
					a => a[0]
				);
			} else {
				return file_id;
			}
		},
	};
};
