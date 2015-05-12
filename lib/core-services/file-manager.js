var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var path = require('path');
var fse = require("fs-extra");
var fs = require("fs");
var ResourceRepresentation = require("../chip-types/resource-representation.js");

/**
 * Manages files
 * @class
 */
var FileManager = new function() {
    this.name = "files";
    this.save_file = function(dispatcher, files_data, upload_path) {
        var files = files_data.files;
        var owner = files_data.owner;

        if (!upload_path) {
            upload_path = "./uploaded_files/";
        }

        var upload_path_abs = path.resolve(root_path(), "../" + upload_path);

        if (!fs.existsSync(upload_path_abs)) {
            fse.mkdirs(upload_path_abs, function(err) {
                if (err) return console.error(err);
            });
        }

        if (!files[0]) {
            files = [files];
        }

        var saved_files_data = [];

        for (var i in files) {
            var newID = UUIDGenerator(10);

            var upload_path_with_filename = upload_path_abs + "/" + newID;
            files[i].pipe(fs.createWriteStream(upload_path_with_filename));

            var hapi_filename = files[i].hapi.filename;
            var file_details = {
                sealious_name: newID,
                original_name: hapi_filename.substr(0, hapi_filename.lastIndexOf('.')),
                extension: hapi_filename.split(".").reverse()[0],
                path: upload_path,
                owner: owner
            }

            var file_data = {
                sealious_id: newID,
                body: file_details
            };

            dispatcher.datastore.insert("files", file_data, {});
            saved_files_data.push(file_data);
        }

        return saved_files_data;
    }

    this.diff = function(dispatcher, file) {

    }

    this.get_list = function(dispatcher, owner) {
        var query = {
            "body.owner": owner
        };
        Sealious.Logger.info("List for owner '" + owner +"' has been created");
        return this.find(dispatcher, query);
    }

    this.find = function(dispatcher, query) {
        return new Promise(function(resolve, reject) {
            dispatcher.datastore.find("files", query)
                .then(function(documents) {
                    var parsed_documents = documents.map(function(document) {
                        return new ResourceRepresentation(document).getData()
                    });
                    resolve(parsed_documents);
                })
        })
    }

    this.change_name = function(dispatcher, sealious_name, new_name) {
        return dispatcher.datastore.update("files", {sealious_id: sealious_name }, { $set: { "body.original_name":new_name} });
        
    }

    var root_path = function() {
        var parent_tmp = module.parent;
        var parent = null;
        while (parent_tmp) {
            parent = parent_tmp;
            parent_tmp = parent_tmp.parent;
        }

        return parent.filename;
    }
}


//wersjonowanie, historia dostępu, przetrzymywanie poprzednich wersji

module.exports = FileManager;
