FROM node:latest AS deps
LABEL stage=deps
LABEL autodelete="true"

WORKDIR /app
COPY package.json .

RUN npm install -g @angular/cli
RUN npm install -f

COPY . .
RUN ng build && ng run zerofiltre-blog:server

FROM node:16-alpine as prod
WORKDIR /app

ENV NODE_ENV production
ENV OTEL_TRACES_EXPORTER="otlp"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="otelcol-opentelemetry-collector.zerofiltre-bootcamp.svc:4317"
ENV OTEL_NODE_RESOURCE_DETECTORS="env,host,os"
ENV OTEL_SERVICE_NAME="zerofiltre-blog-frontend"
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

COPY --from=deps /app/dist ./dist


ENTRYPOINT ["sh", "-c", "node dist/zerofiltre-blog/server/main.js"]