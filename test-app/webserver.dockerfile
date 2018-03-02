FROM nginx:1.12-alpine
LABEL maintainer="Jakub Pieńkowski <jakski@sealcode.org>"

ENV SSL_DIR=/etc/nginx/ssl

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/uk.alpinelinux.org/g' /etc/apk/repositories
# Create self-signed certificate and set secure permissions.
RUN apk add --no-cache openssl \
    && mkdir $SSL_DIR && chmod 700 $SSL_DIR \
    && openssl req -new -newkey rsa:4096 -nodes -x509 \
    -subj "/C=LO/ST=LO/L=local/O=local/CN=local" \
    -keyout $SSL_DIR/local.key -out $SSL_DIR/local.cert \
    && chmod 400 $SSL_DIR/local.key \
    && chmod 444 $SSL_DIR/local.cert

COPY vhost.conf /etc/nginx/conf.d/default.conf
