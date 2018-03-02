# To create a new Sealious project:

1. Make `replace.sh` executable.
   `chmod +x replace.sh`
2. Add your custom config and execute the script.
   `app_port= project_name= mongo_external_port= nginx_http_port= nginx_https_port= ./replace.sh`
3. Install dependencies and start app.
   `make install && make start`
4. Run tests.
   `make test`
5. In your browser go to `https://localhost:<nginx_https_port>`, it should display some sort of "hello world" now.
