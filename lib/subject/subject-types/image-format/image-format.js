"use strict";
const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");
const { promisify } = require("util");
const sharp = require("sharp");
const fs = require("fs");

const QUALITY = 80;

function format_hash(format_obj) {
	return format_obj.size[0] + ":" + format_obj.size[1] + "(" + QUALITY + ")";
}

function format_filename(original_filename, format_name) {
	return (
		original_filename
			.split(".")
			.slice(0, -1)
			.join(".") +
		"-" +
		format_name +
		".jpg"
	);
}

const ImageFormat = function(app, file_id, format_name) {
	this.name = "ImageFormats";
	this.file_id = file_id;

	function get_hdd_path(file_id) {
		return locreq.resolve(app.FileManager.upload_path + "/" + file_id);
	}

	function create_formatted_version(file_id, format_name) {
		const format_obj = app.ConfigManager.get("image_formats")[format_name];

		return app.Datastore.find("files", { id: file_id }).then(function(
			matches
		) {
			const original_file = matches[0];
			const file_path = get_hdd_path(original_file.id);
			const width = format_obj.size[0];
			const height = format_obj.size[1];
			const filename = format_filename(
				original_file.original_name,
				format_name
			);

			const temp_file_path =
				"/tmp/" + Math.floor(Math.random() * Math.pow(10, 7)) + ".jpg";

			return sharp(file_path)
				.resize(width, height)
				.toFile(temp_file_path)
				.then(function() {
					return promisify(fs.readFile)(temp_file_path);
				})
				.then(function(buffer) {
					return app.FileManager.save_file(
						new app.Sealious.File(
							new app.Sealious.SuperContext(),
							filename,
							buffer
						)
					);
				})
				.then(function(sealious_file) {
					return app
						.run_action(
							new app.Sealious.SuperContext(),
							["collections", "formatted-images"],
							"create",
							{
								original_photo_file: original_file.id,
								formatted_photo_file: sealious_file.id,
								format: format_hash(format_obj),
							}
						)
						.then(() => sealious_file);
				})
				.then(function(file) {
					return promisify(fs.unlink)(temp_file_path).then(
						() => file
					);
				});
		});
	}

	function get_formatted_version(
		file_id,
		file_name,
		format_name,
		format_obj
	) {
		const random = Math.random();
		const hash = format_hash(format_obj);
		return app.Datastore.aggregate("formatted-images", [
			{
				$match: {
					original_photo_file: { $eq: file_id },
				},
			},
			{
				$match: {
					$or: [{ "format.original": hash }, { "format.safe": hash }],
				},
			},
		]).then(function(results) {
			return (
				results[0] &&
				results[0] && {
					id: results[0].formatted_photo_file,
					original_name: format_filename(file_name, format_name),
				}
			);
		});
	}

	const ImageFormatFile = function(file_id, format_name, file_name) {
		this.name = "SingleFile";
		this.file_id = file_id;
		this.file_name = file_name;

		ImageFormatFile.prototype.perform_action = function(
			context,
			action_name,
			args
		) {
			switch (action_name) {
				case "show":
					const format_obj =
						app.ConfigManager.get("image_formats")[format_name] ||
						null;

					if (!format_obj) {
						throw new Errors.BadSubjectPath(
							"Unknown image format: " + format_name
						);
					}

					return get_formatted_version(
						file_id,
						file_name,
						format_name,
						format_obj
					)
						.then(function(result) {
							if (result !== undefined) {
								return result;
							} else {
								return create_formatted_version(
									file_id,
									format_name
								);
							}
						})
						.then(file_description => {
							let ret = new app.Sealious.File.from_db_entry(
								file_description
							);
							ret.path_on_hdd = get_hdd_path(file_description.id);
							ret.mime = "image/jpeg";
							return ret;
						});
				default:
					throw new Errors.DeveloperError(
						`Unknown action for '${this.collection.name}' subject: '${action_name}'`
					);
			}
		};
	};

	ImageFormatFile.prototype = Object.create(Subject.prototype);

	this.get_child_subject = function(file_name) {
		return new ImageFormatFile(file_id, format_name, file_name);
	};
};

ImageFormat.prototype = Object.create(Subject.prototype);

module.exports = ImageFormat;
