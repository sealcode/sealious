//useful for sending content as a file, when the content is generated on the fly and not read directly from hdd
"use strict";

const VirtualFile = function(content, mime){
	this.content = content;
	this.mime = mime || "text/plain";
}

module.exports = VirtualFile;
