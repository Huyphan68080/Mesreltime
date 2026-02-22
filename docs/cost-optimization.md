# Cost Optimization Strategy

## Compute

- Keep services stateless to maximize HPA efficiency.
- Separate autoscaling profiles:
  - messaging/api aggressive
  - worker moderate
  - notification/media conservative
- Use spot/preemptible nodes for workers.

## Data

- TTL indexes for transient data reduce storage growth.
- Archive cold messages to cheaper storage tier if compliance permits.
- Compress media variants and use CDN cache headers.

## Network

- Direct browser-to-object-storage uploads reduce egress through app pods.
- Keep websocket payloads compact; avoid unnecessary high-frequency events.

## Product-level

- Batch notifications in 30-60 second windows.
- Cap attachment size and enforce format policy.
- Precompute hot reads for large channels.