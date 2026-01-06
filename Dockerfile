FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN npx prisma generate
RUN pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "pnpm run db:deploy && node dist/src/main.js"]
