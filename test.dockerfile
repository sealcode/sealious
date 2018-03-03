FROM node:9-alpine
LABEL maintainer="Jakub Pieńkowski <jakski@sealcode.org>"

ENV UID=node \
    GID=node \
    HOME=/opt/sealious

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/uk.alpinelinux.org/g' /etc/apk/repositories
# Tini will ensure that any orphaned processes get reaped properly.
RUN apk add --no-cache tini
RUN apk --update add imagemagick
RUN apk --update add git

VOLUME $HOME
WORKDIR $HOME/test-app

USER $UID:$GID

EXPOSE 8083

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/node", "."]
