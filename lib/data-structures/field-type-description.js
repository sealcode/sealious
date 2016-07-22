"use strict";

const FieldTypeDescription = function(summary, raw_params, extra_info){
	this.summary = summary;
	this.raw_params = raw_params;
	this.extra_info = extra_info || {};
}

module.exports = FieldTypeDescription;
