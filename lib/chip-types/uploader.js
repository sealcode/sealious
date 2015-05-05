var fs = require("fs");
var fse = require('fs-extra');
var path = require('path');
var uid = require('uid');

module.exports = function(uploader, dispatcher, dependencies){
    this.save_file = function(payload, upload_path) {
        var photos = payload["photos"];

        if(photos.hapi)
            if(photos.hapi.filename=='')
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

        if (!photos[0]) {
            photos = [photos];
        }
        for (var i in photos) {
            var upload_path_with_filename = upload_path_abs + "/" + photos[i].hapi.filename;
            photos[i].pipe(fs.createWriteStream(upload_path_with_filename));
        }

    }

}
