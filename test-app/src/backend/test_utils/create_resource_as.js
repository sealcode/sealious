const axios = require("axios");

module.exports = ({ collection, resource, user }) => {
	const session = user ? TEST_CONFIG.USERS[user].SESSION : {};
	return axios
		.post(
			TEST_CONFIG.API_URL + "/collections/" + collection,
			resource,
			session
		)
		.then(({ data }) => data);
};
