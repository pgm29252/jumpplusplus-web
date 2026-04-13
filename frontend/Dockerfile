FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ARG JWT_SECRET=change-this-in-production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV JWT_SECRET=${JWT_SECRET}

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
