"use strict";
const Promise = require("bluebird");

module.exports = function(app){
	return {
		name: "aggregate",
		calculate: function(context, params, item, db_document){
			let stages = params.stages;
			if(params.stages instanceof Function){
				stages = params.stages(context, params, item, db_document);
			}
			return app.Datastore.aggregate(
				params.collection,
				stages
			).then(function(documents){
				if(documents.length){
					return documents[0].result;
				}else{
					return null;
				}
			});
		}
	};
};
