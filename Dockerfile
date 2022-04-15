FROM klakegg/hugo:0.93.2-ext-onbuild AS hugo


FROM nginx:1.21.6-alpine
COPY --from=hugo /target /usr/share/nginx/html
