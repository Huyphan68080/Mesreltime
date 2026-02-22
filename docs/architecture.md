# Realtime Messaging Platform Architecture

## 1. High-level architecture diagram

```text
Clients (Web/Mobile)
  -> CDN + WAF
  -> Nginx/Ingress (TLS termination, sticky session for Socket.io polling fallback)
  -> API Gateway (Fastify)
      -> Auth Service (JWT, session lifecycle)
      -> Messaging Service (REST + Socket.io)
      -> Notification Service
      -> Media Service
  -> Worker (BullMQ consumers)

Data Plane
  - MongoDB Replica Set (shard-ready collections)
  - Redis Cluster (cache, presence TTL, pub/sub)
  - BullMQ queues (retry, batching, DLQ)
  - S3-compatible object storage + CDN

Observability
  - Pino structured logs -> centralized pipeline
  - Metrics: latency, socket count, throughput, queue lag
  - Healthz/Readyz + K8s probes
```

## 2. Clean architecture and modular boundaries

Each service follows layers:
- `domain`: entities/value objects and invariants
- `application`: use-cases and orchestration services
- `infrastructure`: DB/cache/queue adapters
- `interfaces`: HTTP/WS controllers

This keeps business rules independent from transport and storage concerns.

## 3. Microservice separation

- `auth-service`: registration, login, refresh, session revocation, role claims.
- `messaging-service`: conversations, members, messages, receipts, reactions, search, realtime events.
- `notification-service`: notification records, batch window, dispatch queue producer.
- `media-service`: presigned upload URLs, media metadata, encrypted storage flags.
- `api-gateway`: edge routing, auth verification, rate limiting, request normalization.
- `worker`: background retries, delivery fallback, notification dispatch, DLQ.

## 4. WebSocket scaling strategy

- Socket.io + Redis adapter synchronizes events across all messaging pods.
- Sticky sessions are enabled at ingress to support long-polling fallback and consistent upgrade flow.
- Pub/Sub fanout runs through Redis channels; rooms are `conv:{conversationId}`.
- Presence is stored in Redis with TTL heartbeat (`presence:user:{id}`), avoiding DB hot writes.
- Horizontal scale is achieved by adding stateless messaging pods; shared state remains in Redis/Mongo.

## 5. Message delivery strategy

- **At-least-once** delivery: message persist first, then event emit.
- **Idempotency**: unique `(conversationId, clientMessageId)` index.
- **Acknowledgement**: client emits `message.ack` after receiving `message.new`.
- **Retry mechanism**: failed deliveries enqueue to `message-delivery` queue with exponential backoff.
- **Dead letter queue**: jobs exhausting retries are moved to `dead-letter` queue for replay/inspection.

## 6. Database strategy

- Message history: keyset pagination index `{ conversationId: 1, createdAt: -1, _id: -1 }`.
- Dedupe: unique sparse index `{ conversationId: 1, clientMessageId: 1 }`.
- Membership guard: unique `{ conversationId: 1, userId: 1 }`.
- Read receipts and reactions use unique compound indexes to prevent duplicates.
- TTL indexes for refresh token expiry and transient idempotency/session data.
- Read/write separation ready: primary for writes/hot reads, secondary for historical/search reads.
- Sharding path: shard `messages` by hashed `conversationId`; keep targeted index for per-conversation scans.

## 7. Security architecture

- JWT access + refresh lifecycle; refresh token hashed in DB.
- HTTPOnly cookies supported for browser auth.
- Redis-backed rate limiting by IP and user.
- Room membership validation before join/send/read/reaction.
- Zod validation at HTTP and WS boundaries.
- XSS prevention via React escaping + input sanitization policy.
- Secure websocket handshake via bearer token verification.
- Encrypted media storage via server-side encryption in object storage.
- Optional E2EE path: per-conversation key envelopes and client-side payload encryption.

## 8. Performance architecture

- Redis caching for hot conversation metadata and presence.
- Virtualized message rendering on frontend.
- Keyset pagination for low-latency history loading.
- Direct-to-S3 uploads avoid app bandwidth bottleneck.
- Horizontal autoscaling on CPU + custom metrics.
- CDN for static assets and media delivery.

## 9. Bottleneck analysis

- **Hot rooms**: large group fanout spikes; mitigate by shard-aware fanout workers and per-room backpressure.
- **Redis pub/sub saturation**: migrate high fanout streams to Kafka/NATS when needed.
- **Mongo primary write pressure**: batch receipts/reactions and archive cold history.
- **Reconnect storms**: jittered reconnect intervals and randomized heartbeat.
- **Search drift**: move from Mongo text index to Atlas Search/OpenSearch at scale.

## 10. Future path to 1M+ concurrent

1. Phase 1 (100k concurrent): single-region, managed Redis + Mongo replica set, autoscaling + CDN.
2. Phase 2 (300k): multi-region active-passive, regional read replicas, global failover routing.
3. Phase 3 (1M+): active-active regional clusters, partitioned socket gateways, Kafka backbone.
4. Phase 4: dedicated realtime protocol gateways, region-aware tenancy, stricter data sovereignty.