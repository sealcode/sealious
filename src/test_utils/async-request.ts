import { request, type RequestOptions } from "http";

export default async function asyncRequest(
	options: RequestOptions,
	form_data?: string
): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		try {
			const req = request(options, (res) => {
				res.setEncoding("utf-8");
				res.on("data", (chunk) => {
					resolve(JSON.parse(chunk));
				});
			});

			req.on("error", reject);

			form_data && req.write(form_data);
			req.end();
		} catch (e) {
			console.error(e);
			reject(e);
		}
	});
}
