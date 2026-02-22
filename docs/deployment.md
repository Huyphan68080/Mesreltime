# Production Deployment Guide

## 1. Build and release

1. Build immutable images per app from `infra/docker/Dockerfile.service`.
2. Tag with commit SHA.
3. Push to registry.
4. Apply migrations/indexes before shifting traffic.

## 2. Kubernetes deployment

- Base manifests: `infra/k8s/base`
- Environment overlays:
  - `infra/k8s/overlays/staging`
  - `infra/k8s/overlays/prod`

Apply example:

```bash
kubectl apply -k infra/k8s/overlays/staging
```

## 3. Readiness and liveness

- Every service exposes:
  - `/healthz`: process health
  - `/readyz`: dependency readiness
- K8s probes configured in all deployments.

## 4. Rollout strategy

- Use rolling updates with surge and maxUnavailable controls.
- For high risk changes, use canary (10% -> 50% -> 100%) with SLO gates.

## 5. SLO checks before promotion

- API p95 < 150ms
- Message end-to-end p95 < 100ms (in-region)
- Error rate < 1%
- Queue lag within budget

## 6. Centralized logging and metrics

- Pino JSON logs shipped to ELK/Loki.
- Prometheus metrics:
  - `http_request_duration_ms`
  - `socket_active_connections`
  - `message_emit_rate`
  - `bullmq_queue_lag_seconds`
  - `mongo_query_duration_ms`

## 7. Disaster recovery

- Redis persistence and backups enabled.
- MongoDB backup snapshots and PITR.
- Object storage lifecycle and cross-region replication.