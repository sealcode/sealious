var Sealious = require("sealious");
var winston = require('winston');
var ConfigManager = Sealious.ConfigManager;

/*
    This is the default configration of Sealious logger.
    To retrieve a specifig setting, use "get_config()" function, ex. "ConfigManager.get_config().logger_config.logger_level".

    @logger_level - specifies from which log level (displayed below) onward should be displayed, 
    @logger_color - specifies if the log should be colorized, values "true" or "false"
    @logger_file - defines a filename to save the logs, if a falsy value is given the logs will not be saved,
    @logger_dirname - defines a default path to save the logs,
    @logger_to_json - specifies the format of the saved logs,
    @logger_rotation - defines the log rotation format, set to daily by default
*/
ConfigManager.set_default_config(
	"logger_config", {
		logger_level: "info",
		logger_color: true,
		logger_file: null,
		logger_dirname: ".",
		logger_to_json: false,
		logger_rotation: '.yyyy-MM-Tdd'
	});


/*
    This is the custom logger level and color configuration.

    @levels - default logger levels, 0 being the lowest importance, 4 being the highest:
       * lazyseal - an Easter, or should we say: Sealious egg. Used only for humorous reasons, the lowest level of importance, default color: white,
       * info - used for stating the current status or general information such as starting the server, default color: green,
       * debug - used for debugging, default color: blue,
       * warning - used to display warnings, default color: yellow,
       * error - used to display errors, default color: red
    
*/
var custom = {
	levels: {
		lazyseal: 0,
		info: 1,
		debug: 2,
		warning: 3,
		error: 4,
		no_output: 5
	},
	colors: {
		lazyseal: "white",
		info: "green",
		debug: 'blue',
		warning: 'yellow',
		error: 'red'
	}
};

/*
    Returns the current date and time, default format: "yyyy-mm-dd hh:mm:ss.mmm", ex. "2000-01-01 20:00:00.000"   
*/
function getDateTime (with_date) {

	var date = new Date();

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var milli = date.getMilliseconds();
	milli = (milli < 10 ? "00" : "") + milli;
	milli = (milli < 100 && milli >= 10 ? "0" : "") + milli;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	if (!with_date) {
		return hour + ":" + min + ":" + sec + "." + milli;
	} else {
		return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec + "." + milli;
	}

}

var transports_array = new Array();

var logger_level = ConfigManager.get_config().logger_config.logger_level;
var logger_color = ConfigManager.get_config().logger_config.logger_color;
var logger_file = ConfigManager.get_config().logger_config.logger_file;
var logger_dirname = ConfigManager.get_config().logger_config.logger_dirname;
var logger_to_json = ConfigManager.get_config().logger_config.logger_to_json;
var logger_rotation = ConfigManager.get_config().logger_config.logger_rotation;


var winston_level = new(winston.transports.Console)({
	level: logger_level,
	colorize: logger_color,
	timestamp: function(){
		return getDateTime(false);
	}
});
transports_array.push(winston_level);

if (logger_file) {
	var winston_save_to_file = new(winston.transports.File)({
		filename: logger_file,
		colorize: logger_color,
		timestamp: function(){
			return getDateTime(true);
		},
		dirname: logger_dirname,
		json: logger_to_json
	});
	var winston_daily_rotate = new(winston.transports.DailyRotateFile)({
		filename: logger_file,
		datePattern: logger_rotation
	});
	transports_array.push(winston_save_to_file);
	transports_array.push(winston_daily_rotate);
}


var logger = new winston.Logger({
	levels: custom.levels,
	colors: custom.colors,
	transports: transports_array
});

module.exports = logger;