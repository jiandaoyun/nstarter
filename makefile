docker-build:
	docker build --target=test-report -o report .

docker-release:
	docker build --target=release .

clean:
	rm -rf report/

.PHONY: clean