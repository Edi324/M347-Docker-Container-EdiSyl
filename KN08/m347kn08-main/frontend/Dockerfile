# --- Stage 1: build the React app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ ./
# .env.production holds PLACEHOLDER tokens (FRONTEND_MS_*), so the build
# bakes the placeholders into the JS instead of real URLs.
RUN npm run build

# --- Stage 2: serve with nginx + runtime env injection ---
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# The nginx image runs any script in /docker-entrypoint.d/ before starting nginx.
COPY env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh
EXPOSE 80
