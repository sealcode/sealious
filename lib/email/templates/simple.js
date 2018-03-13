const Message = require("./../message.js");
const path = require("path");
const mjml2html = require("mjml");
const assert = require("assert");

module.exports = async function SimpleTemplate(app, data) {
	assert(data.text);
	assert(data.subject);
	assert(data.to);
	const logo_cid = Math.floor(Math.random() * 10e6).toString();
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
		text: data.text,
		html: mjml2html(`
				<mjml>
				  <mj-body>
					<mj-section>
					  <mj-column>
						<mj-image width="100" src="cid:${logo_cid}"></mj-image>
				        <mj-divider border-color="${(app.manifest.colors &&
									app.manifest.colors.primary) ||
									"black"}"></mj-divider>
						<mj-text>
                          <h1>
                             ${data.subject}
                          </h1>
						  ${data.text}
						</mj-text>
					  </mj-column>
					</mj-section>
				  </mj-body>
				</mjml>
            `).html,
	});
};
