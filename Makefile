env:
	npm install
	npm i -g gulp

fast: env
	gulp

run:
	gulp run

docker:
	docker build -t resume .