# ---------- Stage 1: build ----------
FROM node:24 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: production ----------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund \
  && npm cache clean --force \
  && rm -rf /root/.npm /tmp/* \
  && rm -rf /usr/local/lib/node_modules/npm \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
  
COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]
