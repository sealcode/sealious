import { request, RequestOptions } from "http";

export default async function asyncRequest(
	options: RequestOptions,
	form_data: string
): Promise<Record<string, unknown>> {
	return new Promise((resolve) => {
		const req = request(options, (res) => {
			res.setEncoding("utf-8");
			res.on("data", (chunk) => {
				resolve(JSON.parse(chunk));
			});
		});

		req.write(form_data);
		req.end();
	});
}
