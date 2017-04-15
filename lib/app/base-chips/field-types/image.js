"use strict";
const Promise = require("bluebird");
const assert = require("assert");
const locreq = require("locreq")(__dirname);
const File = locreq("lib/data-structures/file.js");

module.exports = function(app) {
    // params.formats = {name: {size: [width_px, height_px]}}
    // params.default_format = format_name || "original"

    const File = app.ChipManager.get_chip("field_type", "file");

    return {
        name: "image",
        extends: "file",
        is_proper_value: function(context, params, new_value) {
            return File.is_proper_value(
                context,
                params,
                new_value
            ).then(function() {
                if (new_value.mime.indexOf("image/") !== 0) {
                    return Promise.reject("Only image files are allowed");
                }
            });
        },
        format: function(context, params, decoded_value, format) {
            const formats = params.formats || {};

            if (decoded_value === undefined) {
                return undefined;
            }

            if (format === undefined)
                format = params.default_format || "original";

            if (format === "original") {
                return File.format(context, params, decoded_value, "url");
            } else {
                return `/api/v1/formatted-images/${decoded_value.id}/` +
                    `${format}/${decoded_value.filename}`;
            }
        },
    };
};
