import axios from "axios";
import tough from "tough-cookie";

export default class MockRestApi {
	constructor(public base_url: string) {}
	async get(url: string, options?: Parameters<typeof axios.get>[1]) {
		return (await axios.get(`${this.base_url}${url}`, options)).data;
	}
	async delete(url: string, options?: Parameters<typeof axios.delete>[1]) {
		return (await axios.delete(`${this.base_url}${url}`, options)).data;
	}
	async patch(
		url: string,
		data: any,
		options?: Parameters<typeof axios.patch>[1]
	) {
		return (await axios.patch(`${this.base_url}${url}`, data, options))
			.data;
	}
	async post(
		url: string,
		data: any,
		options?: Parameters<typeof axios.post>[2]
	) {
		return (await axios.post(`${this.base_url}${url}`, data, options)).data;
	}
	async login({
		username,
		password,
	}: {
		username: string;
		password: string;
	}) {
		const cookie_jar = new tough.CookieJar();
		const options = {
			jar: cookie_jar,
			withCredentials: true,
		};
		await axios.post(
			`${this.base_url}/api/v1/sessions`,
			{
				username,
				password,
			},
			options
		);
		return options;
	}
}
