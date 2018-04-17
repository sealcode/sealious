"use strict";
"use strict";

const VirtualFile = function(content, mime) {
	this.content = content;
	this.mime = mime || "text/plain";
};

module.exports = VirtualFile;
