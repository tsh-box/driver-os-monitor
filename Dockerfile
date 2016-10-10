FROM debian:jessie

LABEL databox.type="driver"

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.7.0
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl xz-utils

RUN curl --insecure -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

#node app config
ADD ./src /src
ADD ./package.json /package.json

RUN npm install
RUN npm run clean

EXPOSE 8080

CMD ["npm","start"]