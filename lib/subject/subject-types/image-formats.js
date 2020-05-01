const Subject = require("../subject.js");

const ImageFormat = require("./image-format/image-format.js");

const ImageFormats = function (app, file_id) {
	this.name = "ImageFormats";
	this.file_id = file_id;

	this.get_child_subject = function (format_name) {
		return new ImageFormat(app, file_id, format_name);
	};
};

ImageFormats.prototype = Object.create(Subject.prototype);

module.exports = ImageFormats;
