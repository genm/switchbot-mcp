# syntax=docker/dockerfile:1

FROM node:24-alpine@sha256:f70403e87646dc51b45295f4b8b70cdad0b63d2297c4c9899119b03f7af7a6b3 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine@sha256:f70403e87646dc51b45295f4b8b70cdad0b63d2297c4c9899119b03f7af7a6b3 AS runtime
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
