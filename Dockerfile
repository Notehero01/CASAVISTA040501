FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

ARG VITE_API_URL=/api
ARG VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p data uploads

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
