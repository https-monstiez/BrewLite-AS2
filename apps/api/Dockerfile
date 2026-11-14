FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app
ARG APP_VERSION=local
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
USER node
EXPOSE 3001
CMD ["node", "scripts/start-production.mjs"]
