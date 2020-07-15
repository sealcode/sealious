.PHONY: db test test-nginx start test watch install

db:
	docker-compose up -d db

start: db test-nginx

stress-test:
	./npm.sh run stress-test

test:
	./npm.sh run test

watch:
	./npm.sh run watch

install:
	./npm.sh ci

docs:
	npm install
	npm run docs
