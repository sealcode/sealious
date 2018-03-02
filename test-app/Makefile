.PHONY: db app app-nginx start test watch build install

db: 
	docker-compose up -d db

app: db
	docker-compose up app

app-nginx: db
	docker-compose up app webserver

start: db build app-nginx

test: db
	./npm.sh run test

watch: 
	./npm.sh run watch

build:
	./npm.sh run build

install:
	./npm.sh install
