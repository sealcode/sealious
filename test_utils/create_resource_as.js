const axios = require("axios");

module.exports = ({ collection, port, resource, user }) => {
	const session = user ? TEST_CONFIG.USERS[user].SESSION : {};
	return axios
		.post(
			`http://localhost:${port}/api/v1/collections/${collection}`,
			resource,
			session
		)
		.then(({ data }) => data);
};
