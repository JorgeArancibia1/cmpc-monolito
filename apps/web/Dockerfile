# Frontend React/Vite — build estático servido por Nginx
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts packages/contracts
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --filter @cmpc/web... --frozen-lockfile
COPY . .
ARG VITE_API_URL=http://localhost:3002
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @cmpc/contracts build && pnpm --filter @cmpc/web build

FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
