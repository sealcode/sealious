const request = require("request-promise");
const Logger = require.main.require("lib/logger/logger.js");
const Errors = require.main.require("lib/response/error.js");

function check_for_updates(pkg) {
    if (typeof pkg === "object") {
        const pkg_split = pkg.version.split(".");
        const version = pkg_split[0] + "." + pkg_split[1];
        const url = "http://registry.npmjs.org/sealious/" + version;
        let status = "warning";
        let message;

        return request(url)
            .then(res => JSON.parse(res))
            .then(function(sealious_npm) {
                if (sealious_npm.error){
                    message = `npm registry error when requesting info for version ${version}: ${sealious_npm.error}`;
                } else if (!sealious_npm.version || sealious_npm === undefined){
                    message = `unknown npm registry error when requesting info for version ${version}`;
                } else {
                    const sealious_npm_array = sealious_npm.version.split(".");

                    if ((sealious_npm.version !== pkg.version) && (parseInt(sealious_npm_array[2]) > parseInt(pkg_split[2]))) {
                        message = `Sealious@${pkg.version} - update available. Run "npm install sealious@${sealious_npm.version}" to update.`
                    } else {
                        status = "info";
                        message = `Sealious@${pkg.version} is up-to-date`
                    }
                }
                return {status, message};
            })
            .catch(function(err) {
                Logger.warning("No network connection available! Unable to fetch information about Sealious updates.");
                throw err;
            });
    }
    else {
        throw new Errors.ValidationError("Wrong arguments was passed!");
    }
}

module.exports = check_for_updates;
