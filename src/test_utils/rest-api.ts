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

// using `any` as return type as it's only supposed to be used for tests, anyway
export default class MockRestApi {
	constructor(public base_url: string) {}
	async get(
		url: string,
		options?: Parameters<typeof fetch>[1],
		query: Record<string, unknown> = {}
	): Promise<any> {
		const response = await fetch(
			`${this.base_url}${url}${
				query && Object.values(query).length > 0
					? "?" + qs.stringify(query)
					: ""
			}`,
			{
				method: "get",
				...options,
			}
		);
		if (!response.status.toString().startsWith("2")) {
			throw {
				response: {
					data: await response.json(),
					status: response.status,
				},
			};
		}
		if (response.headers.get("content-type")?.includes("json")) {
			const text = await response.text();
			return JSON.parse(text) as unknown as Record<string, unknown>;
		} else {
			return response.text();
		}
	}
	async delete(
		url: string,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		return await fetch(`${this.base_url}${url}`, {
			method: "delete",
			...options,
		});
	}
	async patch(
		url: string,
		data: any,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		const response = await fetch(`${this.base_url}${url}`, {
			method: "PATCH",
			...options,
			headers: {
				...(options?.headers || {}),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
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
			return JSON.parse(text);
		} else {
			return text;
		}
	}
	async post(
		url: string,
		data: any,
		options?: Parameters<typeof fetch>[1]
	): Promise<any> {
		const response = await fetch(`${this.base_url}${url}`, {
			method: "post",
			...options,
			headers: {
				...(options?.headers || {}),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		if (!response.status.toString().startsWith("2")) {
			throw {
				response: {
					data: await response.json(),
					status: response.status,
				},
			};
		}
		const text = await response.text();
		return JSON.parse(text);
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
