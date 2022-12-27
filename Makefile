env:
	npm install
	npm i -g gulp

fast: env
	gulp

run:
	@gulp run

docker-build:
	docker-compose build

docker:
	docker-compose up -d