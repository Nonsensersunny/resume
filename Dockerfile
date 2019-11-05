FROM node:latest AS build
RUN mkdir -p /app/app
ADD . /app
WORKDIR /app
RUN npm config set registry https://registry.npm.taobao.org && \
    npm install && npm install gulp && \
    ./node_modules/.bin/gulp && \
    mv dist app/ && \
    mv font app/ && \
    mv lib app/ && \
    mv CNAME app/ && \
    mv index.html app/ && \
    mv favicon.ico app/


FROM nginx:latest
LABEL maintainer="Zyven Zhao"
RUN rm -rf /usr/share/nginx/html && mkdir /usr/share/nginx/html
COPY --from=build /app/app /usr/share/nginx/html/