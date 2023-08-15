ARG NODE_IMAGE=node:18.13.0-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

COPY . .
RUN npm install

# 编译
FROM build-env as compile
RUN npm run build

FROM build-env as test
RUN npm run eslint:html \
    && npm run test

# 输出报告
FROM scratch as test-report
COPY --from=test /var/opt/build/lint/ /lint
COPY --from=test /var/opt/build/coverage/ /coverage

# 发布
FROM compile as release
ARG TOKEN

RUN echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc \
    && npm publish
