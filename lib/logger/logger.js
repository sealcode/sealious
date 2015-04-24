var winston = require('winston');
var ConfigManager = require("../config/config-manager.js");

ConfigManager.set_default_config(
    "logger_config", 
    {
        logger_level : "lazyseal",
        logger_color : true,
        logger_file : "test.log",
        logger_dirname: "."
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

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var milli = date.getMilliseconds();
    milli = (milli < 10? "00" : "") + milli;
    milli = (milli < 100 && milli >=10? "0" : "") + milli;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec + "." + milli;

}

var transports_array = new Array();
var logger_level = ConfigManager.get_config().logger_config.logger_level;
var logger_color = ConfigManager.get_config().logger_config.logger_color;
var logger_file = ConfigManager.get_config().logger_config.logger_file;
var logger_dirname = ConfigManager.get_config().logger_config.logger_dirname;


var winston_level = new (winston.transports.Console)({ level: logger_level, colorize: logger_color, timestamp: function() { return getDateTime(); }  });
transports_array.push(winston_level);

if (logger_file) {
    var winston_save_to_file = new (winston.transports.File)({ filename: logger_file, colorize: logger_color, timestamp: function() { return getDateTime(); }, dirname: logger_dirname });
    transports_array.push(winston_save_to_file);
}

var logger = new (winston.Logger)(
    { 
        levels: myCustomLevels.levels, 
        colors: myCustomLevels.colors,
        transports: transports_array
    }
);

module.exports = logger;