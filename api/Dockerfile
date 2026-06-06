FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice-calc \
    libreoffice-writer \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run prisma:generate && npm run build

EXPOSE 4000

CMD ["sh", "-c", "npm run prepare:prod && npm run start:prod"]
