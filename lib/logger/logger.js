var winston = require('winston');
var ConfigManager = require("../config/config-manager.js");

ConfigManager.set_default_config(
    "logger_config", 
    {
        logger_level : "info",
        logger_file : null,
        logger_color : true
    });

var myCustomLevels = {
    levels: {
        lazyseal: 0,
        info: 1,
        debug: 2,
        warning: 3,
        error: 4
    },
    colors: {
        lazyseal: "white",
        debug: 'blue',
        warning: 'yellow',
        error: 'red'
    }
};

var transports_array = new Array();
var logger_level = ConfigManager.get_config().logger_config.logger_level;
var logger_file = ConfigManager.get_config().logger_config.logger_file;
var logger_color = ConfigManager.get_config().logger_config.logger_color;


var winston_level = new (winston.transports.Console)({ level: logger_level, colorize: logger_color });
transports_array.push(winston_level);

if (ConfigManager.get_config().logger_config.log_file_path) {
    var winston_save_to_file = new (winston.transports.File)({ filename: logger_file, colorize: logger_color });
    transports_array.push(winston_save_to_file);
}


var logger = new (winston.Logger)(
{ 
    levels: myCustomLevels.levels, 
    colors: myCustomLevels.colors,
    transports: transports_array
}
);


