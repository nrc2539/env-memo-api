FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN yarn build
RUN yarn install --production --frozen-lockfile --ignore-scripts

FROM node:22-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/src/main"]
