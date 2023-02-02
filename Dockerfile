ARG NODE_IMAGE=node:14.18.1-alpine

# 发布
FROM ${NODE_IMAGE} as release
ARG TOKEN

RUN echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc \
    && npm publish