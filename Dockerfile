FROM node:latest AS build
LABEL stage=build
LABEL autodelete="true"

WORKDIR /app
COPY package.json .

RUN npm install -g @angular/cli
RUN npm install -f

COPY . .
RUN ng build && ng run zerofiltre-blog:server


FROM node:latest AS deps
LABEL stage=deps
LABEL autodelete="true"

WORKDIR /app
COPY package.json .

RUN npm install -f --production
RUN npm install -f --save @opentelemetry/api
RUN npm install -f --save @opentelemetry/auto-instrumentations-node


FROM node:16-alpine AS prod
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV="production"

ENTRYPOINT ["sh", "-c", "node --require @opentelemetry/auto-instrumentations-node/register dist/zerofiltre-blog/server/main.js"]