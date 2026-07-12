FROM node:22-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN corepack pnpm build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]
