# MesrelTime Realtime Messaging Platform

Production-oriented monorepo for a Discord/Messenger-style system using Next.js, Fastify, Socket.io, MongoDB, Redis, BullMQ, Docker, and Kubernetes.

## Quick start

1. `pnpm install`
2. `docker compose -f infra/docker/docker-compose.yml up -d`
3. `pnpm dev`

## Windows FE + Ubuntu Docker backend

Use this mode when frontend runs on Windows and all backend services run on Ubuntu with Docker.

1. Start backend on Ubuntu:
   - `docker compose -f infra/docker/docker-compose.yml up -d mongodb mongo-init-replica redis minio auth-service messaging-service notification-service media-service api-gateway worker`
2. Get Ubuntu LAN IP:
   - `hostname -I`
3. Set frontend env on Windows (`apps/web/.env.local`):
   - `NEXT_PUBLIC_API_URL=http://<UBUNTU_IP>:4000`
   - `NEXT_PUBLIC_SOCKET_URL=http://<UBUNTU_IP>:4002`
4. Start frontend on Windows:
   - `pnpm dev`

## Apps

- `apps/web` - Next.js 14 application.
- `apps/api-gateway` - External API gateway.
- `apps/auth-service` - Auth + JWT + RBAC.
- `apps/messaging-service` - Conversations, messages, realtime sockets.
- `apps/notification-service` - Notification API.
- `apps/media-service` - File upload metadata + object storage integration.
- `apps/worker` - BullMQ workers for retries, DLQ, and notifications.

## Infrastructure

- `infra/docker` - local compose stack.
- `infra/nginx` - reverse proxy and websocket upgrade config.
- `infra/k8s` - Kubernetes base manifests and overlays.
- `docs` - architecture and runbooks.
