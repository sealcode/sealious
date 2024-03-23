import Message from "./../message.js";
import path from "path";
import mjml2html from "mjml";
import assert from "assert";
import type { App } from "../../main.js";

export type Button = { text: string; href: string };

export type SimpleTemplateData = {
	text: string;
	subject: string;
	to: string;
	buttons?: Button[];
};

export default async function SimpleTemplate(
	app: App,
	data: SimpleTemplateData
) {
	assert(data.text);
	assert(data.subject);
	assert(data.to);
	assert(data.buttons === undefined || Array.isArray(data.buttons));
	if (data.buttons === undefined) {
		data.buttons = [];
	}
	const logo_cid = Math.floor(Math.random() * 10e6).toString();
	let html;
	if ((app.ConfigManager.get("core") as any).environment === "production") {
		html = get_html(app, data, logo_cid);
	} else {
		html = /* HTML */ `Dummy html text. Enable production mode in app config
		to render html each time. This is disabled by default to speed up test
		execution time.`;
	}

	const text = data.text + "\n\n" + buttons_to_text(data.buttons);
	return new Message({
		to: data.to,
		subject: data.subject,
		attachments: [
			{
				filename: path.basename(app.manifest.logo),
				path: app.manifest.logo,
				cid: logo_cid,
			},
		],
		text,
		html,
	});
}

function buttons_to_text(buttons: Button[]) {
	return buttons
		.map((button) => `\t* ${button.text}: ${button.href}`)
		.join("\n");
}

function get_html(app: App, data: SimpleTemplateData, logo_cid: string) {
	const result = mjml2html(`
		<mjml>
		  <mj-body>
			<mj-section>
			  <mj-column>
				<mj-image width="220" src="cid:${logo_cid}"></mj-image>
				<mj-divider border-color="${
					(app.manifest.colors && app.manifest.colors.primary) ||
					"black"
				}"></mj-divider>
				<mj-text>
				  <h1>
					 ${data.subject}
				  </h1>
				  ${data.text}
				</mj-text>
				${
					(data.buttons &&
						data.buttons.map(
							(button) =>
								`<mj-button href="${
									button.href
								}" font-size="20px" background-color="${
									(app.manifest.colors &&
										app.manifest.colors.primary) ||
									"#0074D9"
								}">${button.text}</mj-button>`
						)) ||
					""
				}
			  </mj-column>
			</mj-section>
		  </mj-body>
		</mjml>
    `);
	return result.html;
}
