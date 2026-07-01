FROM node:22-alpine AS build

WORKDIR /app

# Accept VITE_API_URL as build argument for Railway deployment
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Allow configuring which nginx conf to use (default: Railway config without proxy_pass)
ARG NGINX_CONF=nginx.railway.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

EXPOSE 80

# On Railway, $PORT is set dynamically. Use envsubst to inject it into the nginx config.
# For local docker-compose, PORT defaults to 80 via the ENV below.
ENV PORT=80
CMD ["/bin/sh", "-c", "envsubst '$$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
