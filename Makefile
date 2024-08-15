TOKEN ?=

docker-build:
	docker buildx build \
		--progress=plain \
		--file ci/Dockerfile \
		--target=compile ./

docker-release:
	docker buildx build \
		--file ci/Dockerfile \
		--target=release \
		--build-arg TOKEN="${TOKEN}" ./

clean:
	npm run clean

.PHONY: clean
