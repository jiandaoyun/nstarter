TOKEN ?=

docker-build:
	docker build --target=compile .

docker-test:
	docker build --target=test-report -o report .

docker-release:
	docker build --target=release --build-arg TOKEN="${TOKEN}" .

clean:
	rm -rf report/

.PHONY: clean