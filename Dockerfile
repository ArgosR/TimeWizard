FROM node:18-alpine as build
WORKDIR /app
RUN apk add yarn
COPY . /app/
# Add nodelinker to node modules if it doesn't exists
RUN yarn set version berry && grep -qF 'nodeLinker' .yarnrc.yml  || echo "nodeLinker: pnp" >> .yarnrc.yml
RUN yarn plugin import workspace-tools
RUN yarn install
RUN yarn run build
RUN yarn workspaces focus --all --production
RUN yarn dlx modclean modclean -r

FROM alpine:3.16 as prod
# Nodejs-current is 18.X. It won't change before Node 20
RUN apk add --no-cache nodejs-current upx && upx --best --lzma /usr/bin/node && apk del upx
WORKDIR /app
COPY --from=build /app/dist/                        /app
COPY --from=build /app/node_modules                 /node_modules

CMD ["node", "/app/main.js"]
