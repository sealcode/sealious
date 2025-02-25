// returning any as this function is only supposed to be used for tests

export async function post(
	url: string,
	body: Record<string, unknown>
): Promise<unknown> {
	const response = await fetch(url, {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	if (!response.status.toString().startsWith("2")) {
		throw { response: { data: await response.json(), ...response } };
	}
	const json = response.json();
	return json;
}
