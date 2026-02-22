# Trade-off Analysis

## REST vs GraphQL

- REST chosen for core messaging APIs due simpler caching, rate limiting, and predictable latency.
- GraphQL can be added later for dashboard/analytics aggregation where flexible shaping matters.

## Monolith vs Microservices

- Codebase uses modular boundaries now, deploys independently when needed.
- This avoids early distributed-system overhead while keeping migration path open.

## WebSocket vs SSE

- WebSocket is required for bidirectional events (typing, receipt, reaction, call signaling).
- SSE remains useful for simple server push fallback but is insufficient for chat interactivity.