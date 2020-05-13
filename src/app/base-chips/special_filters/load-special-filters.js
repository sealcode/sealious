module.exports = app => {
	require("./IsReferencedByResourcesMatching.js")(app);
	require("./matches.js")(app);
};
