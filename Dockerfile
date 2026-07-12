FROM node:22-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: skip dependency lifecycle scripts. pnpm v10+ otherwise
# hard-fails a non-interactive install on un-approved build scripts (esbuild via
# tsx). The build only needs tsc, and esbuild's binary ships via an optional
# dependency (no script required), so skipping scripts is safe here.
RUN corepack enable && corepack pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN corepack pnpm build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=build /app/dist ./dist

# Drop root: the official node image ships a non-root `node` user (uid 1000).
# Install runs as root (corepack needs /usr/local), then we hand ownership to
# `node` and switch before running. Runtime writes nothing to disk (logs go to
# stdout), so read+execute is all it needs.
RUN chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
