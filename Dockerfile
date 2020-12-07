FROM node:12.16.2-alpine as build

WORKDIR /var/opt/build
COPY . .

RUN npm config set registry 'https://mirrors.huaweicloud.com/repository/npm/' && \
    npm install

ENV NODE_ENV=test

RUN mkdir -p ./resources && \
    npm run schema && \
    npm run lint:html && \
    npm run test && \
    npm run build

# 输出结果
FROM scratch as export
COPY --from=build /var/opt/build/coverage ./coverage
COPY --from=build /var/opt/build/lint ./lint

# 发布
FROM build as release
ARG TOKEN

RUN npm config set registry "https://registry.npmjs.org" && \
    echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc && \
    npm whoami && \
    npm publish
