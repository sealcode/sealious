const Sealious = require("./lib/main.js");

const axios = require("axios");
const axiosCookieJarSupport = require("@3846masa/axios-cookiejar-support");
axiosCookieJarSupport(axios);

global.Sealious = Sealious;
