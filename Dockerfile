# syntax=docker/dockerfile:1

FROM node:26-alpine@sha256:233761595746769ebfdb6090f44fc7cdf818ae0ce62d2b37e0367723b9823e36 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:26-alpine@sha256:233761595746769ebfdb6090f44fc7cdf818ae0ce62d2b37e0367723b9823e36 AS runtime
LABEL org.opencontainers.image.source="https://github.com/genm/switchbot-mcp" \
      org.opencontainers.image.licenses="ISC"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node LICENSE README.md SECURITY.md SUPPORT.md ./
COPY --chown=node:node docs/security-model.md ./docs/security-model.md
USER node
CMD ["node", "build/index.js"]
