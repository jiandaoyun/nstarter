ARG NODE_IMAGE=node:20.16.0-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

COPY .npmrc package.json ./
RUN npm install
COPY . .

# 编译
FROM build-env as compile

RUN npm run eslint:html \
    && npm run build

# 输出报告
FROM scratch as test-report
COPY --from=compile /var/opt/build/lint/ /lint

# 发布
FROM compile as release
ARG TOKEN

RUN echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc \
    && npm publish
