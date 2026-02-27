# frontend/Dockerfile (dev: install deps only, compose runs pnpm run dev)
FROM node:20-alpine

# Install pnpm (project uses pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and install (no production build - compose runs dev server)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]