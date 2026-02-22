# Deliverables Mapping

1. Full folder structure (monorepo style)
- Root workspace + `apps/*`, `packages/*`, `infra/*`, `docs/*`

2. High-level architecture diagram (text)
- `docs/architecture.md`

3. Microservice separation explanation
- `docs/architecture.md` (section 3)

4. Database schema definitions
- `docs/database.md`
- service models under:
  - `apps/auth-service/src/infrastructure/db/models.ts`
  - `apps/messaging-service/src/infrastructure/db/models.ts`
  - `apps/notification-service/src/infrastructure/db/models.ts`
  - `apps/media-service/src/application/services/MediaService.ts`

5. MongoDB index strategy
- `docs/database.md`
- index declarations in model files above

6. API route design
- `docs/api-design.md`
- runtime routes in service `interfaces/http/routes.ts`

7. WebSocket event list
- `docs/api-design.md`
- runtime implementation in `apps/messaging-service/src/interfaces/ws/socketServer.ts`

8. Scaling strategy explanation
- `docs/architecture.md` sections 4, 5, 10

9. Bottleneck analysis
- `docs/architecture.md` section 9

10. Production deployment guide
- `docs/deployment.md`
- `infra/docker/docker-compose.yml`

11. Kubernetes deployment concept
- `infra/k8s/base/*`
- overlays in `infra/k8s/overlays/*`

12. Cost optimization strategy
- `docs/cost-optimization.md`

13. Trade-off analysis
- `docs/tradeoffs.md`

14. Future scaling path to 1M+ concurrent users
- `docs/architecture.md` section 10