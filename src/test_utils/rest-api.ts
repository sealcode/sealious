/* eslint-disable */

import { is, predicates } from "@sealcode/ts-predicates";
import qs from "qs";

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

export type RestAPIError = {
	response: {
		data: any;
	};
};

async function api_call(
	method: string,
	base_url: string,
	url: string,
	data?: Record<string, unknown>,
	options: Parameters<typeof fetch>[1] = {}
) {
	const full_url = `${base_url}${url}${
		method == "get" && data && Object.values(data).length > 0
			? "?" + qs.stringify(data)
			: ""
	}`;
	const response = await fetch(full_url, {
		method: method.toUpperCase(),
		...options,
		headers: {
			...(options?.headers || {}),
			...(["GET", "HEAD"].includes(method.toLocaleUpperCase())
				? {}
				: { "Content-Type": "application/json" }),
		},
		...(["GET", "HEAD"].includes(method.toLocaleUpperCase())
			? {}
			: { body: JSON.stringify(data) }),
	});
	const text = await response.text();
	if (!response.status.toString().startsWith("2")) {
		throw {
			response: {
				data: JSON.parse(text),
				status: response.status,
			},
		};
	}
	if (response.headers.get("Content-Type")?.includes("json")) {
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	} else {
		return text;
	}
}

// using `any` as return type as it's only supposed to be used for tests, anyway
export default class MockRestApi {
	constructor(public base_url: string) {}
	async get(
		url: string,
		options?: Parameters<typeof fetch>[1],
		query: Record<string, unknown> = {}
	): Promise<any> {
		return api_call("GET", this.base_url, url, query, options);
	}
	async delete(
		url: string,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		return api_call("GET", this.base_url, url, undefined, options);
	}
	async patch(
		url: string,
		data: any,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		return api_call("PATCH", this.base_url, url, data, options);
	}
	async post(
		url: string,
		data: any,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		return api_call("POST", this.base_url, url, data, options);
	}
	async login({
		username,
		password,
	}: {
		username: string;
		password: string;
	}): Promise<{ headers: Record<string, string> }> {
		const response = await fetch(`${this.base_url}/api/v1/sessions`, {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username,
				password,
			}),
		});

		const cookies = response.headers.get("set-cookie");
		if (!cookies) {
			throw new Error("No cookies in response");
		}
		const session_id = cookies.split(" ")[0].split("=")[1].slice(0, -1);
		return { headers: { Cookie: `sealious-session=${session_id}` } };
	}
	static async getWithFullUrl(
		url: string,
		options?: Parameters<typeof fetch>[1]
	) {
		return await fetch(`${url}`, options);
	}
}
