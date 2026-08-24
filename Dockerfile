# node:sqlite (used by src/lib/server/db/index.ts) needs a recent Node.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# SvelteKit's build-time route analysis actually imports the server module,
# which opens DATABASE_URL — give it a throwaway path that exists at build
# time. The real value is supplied by docker-compose at runtime.
ENV DATABASE_URL=/tmp/build.db
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
