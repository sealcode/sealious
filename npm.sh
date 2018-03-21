#!/usr/bin/env bash

docker-compose run --rm --service-ports  -u $UID test npm --loglevel warn "$@"
