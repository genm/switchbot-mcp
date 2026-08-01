# syntax=docker/dockerfile:1

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runtime
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
