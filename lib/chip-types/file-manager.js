var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var path = require('path');
var fse = require("fs-extra");
var fs = require("fs");

/**
 * Manages files
 * @class
 */
var FileManager = new function() {

    this.save_file = function(payload, upload_path) {
        var files = payload["files"];

        console.log("file-manager:", payload);

        if(files.hapi)
            if(files.hapi.filename=='')
                return [{ upload_path: "./resources/default/book.png"}];

        var parent_tmp = module.parent;
        var parent = null;
        while(parent_tmp){
            parent=parent_tmp;
            parent_tmp = parent_tmp.parent;
        }

        var upload_path_abs = path.resolve(parent.filename, "../"+upload_path);

        if (!fs.existsSync(upload_path_abs)) {
            fse.mkdirs(upload_path_abs, function(err) {
                if (err) return console.error(err);
            });
        }

        if (!files[0]) {
            files = [files];
        }
        for (var i in files) {
            var upload_path_with_filename = upload_path_abs + "/" + files[i].hapi.filename;
            files[i].pipe(fs.createWriteStream(upload_path_with_filename));
        }

        return files;

    }
}


//wersjonowanie, historia dostępu, przetrzymywanie poprzednich wersji

module.exports = FileManager;
