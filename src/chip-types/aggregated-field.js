const Promise = require("bluebird");
const AggregatedField = function(App, field_name, aggregations) {
	this.app = App;
	this.name = field_name;
	this.aggregations = aggregations;
};

AggregatedField.prototype.get_aggregation_stages = function(context, item) {
	const self = this;
	return Promise.all(
		self.aggregations.map(function(e) {
			if (e instanceof Function) {
				return e(context, item);
			} else {
				return e;
			}
		})
	);
};

module.exports = AggregatedField;
