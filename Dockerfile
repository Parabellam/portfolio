# Compila el sitio estático y lo sirve con Caddy. No hay servidor de aplicación
# ni variables secretas: la imagen final solo contiene HTML, CSS y JS.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
