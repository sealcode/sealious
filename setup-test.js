const Sealious = require("./lib/main.js");
const locreq = require("locreq")(__dirname);

const axios = require("axios");
const axiosCookieJarSupport = require("@3846masa/axios-cookiejar-support");
axiosCookieJarSupport(axios);

global.Sealious = Sealious;
