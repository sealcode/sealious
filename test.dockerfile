FROM node:16-alpine3.11
LABEL maintainer="Jakub Pieńkowski <jakski@sealcode.org>"

ENV UID=1000 \
    GID=1000 \
    HOME=/opt/sealious

# Tini will ensure that any orphaned processes get reaped properly.
RUN apk add --no-cache tini
RUN apk --update add git
RUN apk --update add python
RUN apk --update add make
RUN apk --update add g++

VOLUME $HOME
WORKDIR $HOME

RUN chown $UID:$GID /opt/sealious
RUN mkdir /opt/sealious/node_modules && chown $UID:$GID /opt/sealious/node_modules
VOLUME /opt/sealious/node_modules

RUN apk --update add vips-dev

 # the user is changed within docker-entrypoint.sh
USER 0:0

EXPOSE 8080

ADD docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/usr/local/bin/node", "."]
