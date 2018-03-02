const axios = require("axios");

module.exports = ({ collection, user }) => {
	const session = user ? TEST_CONFIG.USERS[user].SESSION : {};
	return axios
		.get(TEST_CONFIG.API_URL + "/collections/" + collection, session)
		.then(({ data }) => data);
};
