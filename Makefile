TOKEN ?=

docker-build:
	docker buildx build \
		--progress=plain --no-cache \
		--file ci/Dockerfile \
		--target=compile ./

docker-release:
	docker build --target=release --build-arg TOKEN="${TOKEN}" .

clean:
	npm run clean

.PHONY: clean
