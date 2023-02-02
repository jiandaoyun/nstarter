ARG NODE_IMAGE=node:18.13.0-alpine

# 发布
FROM ${NODE_IMAGE} as release
ARG TOKEN

COPY . .

RUN echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc \
    && npm publish