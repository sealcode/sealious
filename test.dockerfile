FROM node:13-alpine
LABEL maintainer="Jakub Pieńkowski <jakski@sealcode.org>"

ENV UID=node \
    GID=node \
    HOME=/opt/sealious

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/mirrors.dotsrc.org/g' /etc/apk/repositories
# Tini will ensure that any orphaned processes get reaped properly.
RUN apk add --no-cache tini
RUN apk --update add git
RUN apk --update add python
RUN apk --update add make
RUN apk --update add g++

VOLUME $HOME
WORKDIR $HOME

USER $UID:$GID

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/node", "."]
