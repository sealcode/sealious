/* eslint-disable */

import axios from "axios";

export type Item<Fields> = {
	id: string;
	[field_name: string]: unknown;
} & Fields;

export type CollectionResponse<Fields = {}> = {
	items: Item<Fields>[];
	attachments: { [id: string]: any };
};

export type ItemResponse<Fields = {}> = {
	items: [Item<Fields>];
	attachments: { [id: string]: any };
};

export type ItemCreatedResponse<Fields = {}> = Item<Fields>;

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
		const response = await axios.post(`${this.base_url}/api/v1/sessions`, {
			username,
			password,
		});

		const session_id = response.headers["set-cookie"][0]
			.split(" ")[0]
			.split("=")[1]
			.slice(0, -1);
		return { headers: { Cookie: `sealious-session=${session_id}` } };
	}
	static async getWithFullUrl(
		url: string,
		options?: Parameters<typeof axios.get>[1]
	) {
		return await axios.get(`${url}`, options);
	}
}
