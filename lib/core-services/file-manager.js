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
    this.name = "files";
    this.save_file = function(dispatcher, files, upload_path) {

        if(!upload_path){
            upload_path = "./resources/";
        }
        if(files.hapi)
            if(files.hapi.filename=='')
                return [{ upload_path: "./resources/default/book.png"}];


        var upload_path_abs = path.resolve(root_path(), "../"+upload_path);

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

    var root_path = function() {
        var parent_tmp = module.parent;
        var parent = null;
        while(parent_tmp){
            parent=parent_tmp;
            parent_tmp = parent_tmp.parent;
        }

        return parent.filename;
    }
}


//wersjonowanie, historia dostępu, przetrzymywanie poprzednich wersji

module.exports = FileManager;
