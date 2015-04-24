var winston = require('winston');
var ConfigManager = require("../config/config-manager.js");

ConfigManager.set_default_config(
    "logger_config", 
    {
        logger_level : "lazyseal",
        logger_color : true,
        logger_file : null,
        logger_dirname: ".",
        logger_to_json: false,
        logger_rotation: '.yyyy-MM-Tdd'
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
var logger_to_json = ConfigManager.get_config().logger_config.logger_to_json;
var logger_rotation = ConfigManager.get_config().logger_config.logger_rotation;


var winston_level = new (winston.transports.Console)({ level: logger_level, colorize: logger_color, timestamp: function() { return getDateTime(); }  });
transports_array.push(winston_level);

if (logger_file) {
    var winston_save_to_file = new (winston.transports.File)({ filename: logger_file, colorize: logger_color, timestamp: function() { return getDateTime(); }, dirname: logger_dirname, json: logger_to_json });
    var winston_daily_rotate = new (winston.transports.DailyRotateFile)( { filename : logger_file, datePattern: logger_rotation });
    transports_array.push(winston_save_to_file);
    transports_array.push(winston_daily_rotate);
}


var logger = new (winston.Logger)(
    { 
        levels: myCustomLevels.levels, 
        colors: myCustomLevels.colors,
        transports: transports_array
    }
);

module.exports = logger;