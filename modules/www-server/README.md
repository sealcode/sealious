## How to use configure `sealious-www-server`?
WWW-server configuration allows you to open ports for listening, define
protocols served on those ports and redirections(useful when you want to
force users to use HTTPS by redirecting them from HTTP). Configuration is
separated into 2 sections: `connections` and `redirections`.

### How `connections` section works?
It's just an array with all connections configurations. All sub-sections should
be objects with properties prepared to be passed directly to
[server.connection()](http://hapijs.com/api#serverconnectionoptions) method from HapiJS.
As described in HapiJS docs, passing `tls` object in config causes connection to use TLS/SSL.

Example:
```
Sealious.ConfigManager.set_config(
    "www_server", {
        connections: [
            { // HTTPS section
                port: 4430,
                tls: {
                    key: fs.readFileSync("sealious.key"),
                    cert: fs.readFileSync("sealious.crt")
                }
            },
            { // HTTP section
                port: 8080
            }
    ]}
);
```
Code above opens 2 connections. First for HTTPS on port 4430 with SSL certificate
and key in `tls` object. Second for plain HTTP on port 8080.

### How `redirections` section works?
It's also an array of sub-sections. They contain information about redirections
on ports. Every sub-section should be an object containing following properties:
* `protocol`
* source redirection port(`from`)
* destination redirection port(`to`)

Sealious reads this sub-sections and tells server how to handle
connection on each port by calling
[server.ext()](http://hapijs.com/api#serverextevent-method-options) from HapiJS.

Example:
```
Sealious.ConfigManager.set_config(
    "chip.channel.www_server", {
        connections: [
            { // HTTPS section
                port: 4430,
                tls: {
                    key: fs.readFileSync("sealious.key"),
                    cert: fs.readFileSync("sealious.crt")
                }
            },
            { // HTTP section
                port: 8080,
            }
        ],
        redirections: [{ // HTTP 2 HTTPS redirection
            from: 8080,
            to: 4430,
            protocol: "https"
        }]
    }
);
```
Code above opens 2 connections like example before, but also force
redirection from port 8080 to 4430. We specify protocol as
HTTPS, so browser will be redirected and try to use TLS/SSL with HTTP.

### How to test HTTPS?
After getting complete configuration example from
[hello-world](https://github.com/Rayvenden/hello-world/tree/https_example)
and
[www_server](https://github.com/Sealious/sealious-www-server/tree/trello%23https_support)
and launching it(`sudo` isn't needed) following links should get you to HTTPS version
of service on 4430 port(HTTP 2 HTTPS redirection is enabled in example):
* https://localhost:4430/
* http://localhost:8080/

Your browser will warn you about insecure certificate, because it's self-signed.
