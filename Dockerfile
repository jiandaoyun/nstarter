ARG NODE_IMAGE=node:14.18.1-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

COPY . .
RUN npm install

# 编译
FROM build-env as build

ENV NODE_ENV=test
RUN npm run lint:html && \
    npm run test &&  \
    npm run build

# 输出报告
FROM scratch as report
COPY --from=build /var/opt/build/coverage ./coverage
COPY --from=build /var/opt/build/lint/ ./lint

# 发布
FROM build as release
ARG TOKEN

RUN npm config set registry "https://registry.npmjs.org" && \
    echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc && \
    npm whoami && \
    npm publish
