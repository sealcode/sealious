const axios = require("axios");

module.exports = ({ collection, port, user }) => {
	const session = user ? TEST_CONFIG.USERS[user].SESSION : {};
	return axios
		.get(
			`http://localhost:${port}/api/v1/collections/${collection}`,
			session
		)
		.then(({ data }) => data);
};
