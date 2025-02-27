.PHONY: start stop restart e2etest

start:
	docker-compose up -d

stop:
	docker-compose down -v

restart:
	docker-compose restart

e2etest:
	bash test/e2e/run-api-tests.sh