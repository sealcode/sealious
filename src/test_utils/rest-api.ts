import axios from "axios";
import tough from "tough-cookie";

export default ({ base_url }: { base_url: string }) => ({
	get: async (url: string, options: Parameters<typeof axios.get>[1]) =>
		(await axios.get(`${base_url}${url}`, options)).data,
	delete: async (url: string, options: Parameters<typeof axios.delete>[1]) =>
		(await axios.delete(`${base_url}${url}`, options)).data,
	patch: async (
		url: string,
		data: any,
		options: Parameters<typeof axios.patch>[1]
	) => (await axios.patch(`${base_url}${url}`, data, options)).data,
	post: async (
		url: string,
		data: any,
		options: Parameters<typeof axios.post>[2]
	) => (await axios.post(`${base_url}${url}`, data, options)).data,
	login: async ({
		username,
		password,
	}: {
		username: string;
		password: string;
	}) => {
		const cookie_jar = new tough.CookieJar();
		const options = {
			jar: cookie_jar,
			withCredentials: true,
		};
		await axios.post(
			`${base_url}/api/v1/sessions`,
			{
				username,
				password,
			},
			options
		);
		return options;
	},
});
