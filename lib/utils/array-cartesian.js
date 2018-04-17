"use strict";
const IntegerCartesian = require("./integer-cartesian.js");

const ArrayCartesian = function(sources) {
	const int_sources = sources.map(list => list.length);
	let current_int_state = null;

	return {
		next: function() {
			const int_next_element = IntegerCartesian.next(
				int_sources,
				current_int_state
			);
			current_int_state = int_next_element;
			if (int_next_element === null) return null;
			return int_next_element.map((index, source_number) => {
				return sources[source_number][index];
			});
		},
	};
};

module.exports = ArrayCartesian;
