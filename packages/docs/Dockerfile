FROM node:23-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
RUN pnpm --filter mycoder-docs build

ENV PORT=8080
EXPOSE ${PORT}

CMD ["pnpm", "--filter", "mycoder-docs", "start"]