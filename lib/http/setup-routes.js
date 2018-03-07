const express = require("express");


function setup_routes(App, express_app){
	const router = express.Router({mergeParams: true});

	router.all("/*", function(req, res, next){
		const elements = req.url.split("/").slice(1);
		res.send();
	});

	return router;
};

module.exports = setup_routes;
