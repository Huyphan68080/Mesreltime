# Operations Runbook

## Alerts

- High p95 message latency
- Rising websocket disconnect rate
- Redis memory > 80%
- Mongo primary replication lag
- BullMQ lag threshold breach

## Incident workflow

1. Identify failing service via readiness/liveness and error rate.
2. Check recent deployments and feature flags.
3. Roll back if SLO breach persists.
4. Drain and replay DLQ jobs after fix.
5. Record incident timeline and action items.

## Capacity planning baseline

- Track peak concurrent sockets per pod.
- Track messages/sec and fanout ratio.
- Scale gateway and messaging independently.