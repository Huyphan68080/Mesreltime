# API and WebSocket Design

## REST routes (gateway -> services)

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/conversations`
- `POST /v1/conversations`
- `GET /v1/conversations/:id/messages`
- `POST /v1/conversations/:id/messages`
- `PATCH /v1/messages/:id`
- `DELETE /v1/messages/:id`
- `POST /v1/messages/:id/read`
- `POST /v1/messages/:id/reactions`
- `DELETE /v1/messages/:id/reactions/:emoji`
- `GET /v1/search/messages`
- `POST /v1/media/upload-url`
- `POST /v1/media/complete`
- `GET /v1/notifications`
- `POST /v1/notifications`
- `POST /v1/notifications/:id/read`

## WebSocket events

Client -> Server:
- `room.join`, `room.leave`
- `message.send`, `message.ack`, `message.retry`
- `typing.start`, `typing.stop`
- `presence.ping`
- `receipt.read`
- `reaction.add`, `reaction.remove`
- `call.offer`, `call.answer`, `call.ice`, `call.hangup` (signaling extension)

Server -> Client:
- `message.new`, `message.delivery`
- `typing.updated`
- `presence.updated`
- `receipt.updated`
- `reaction.updated`
- `notification.new`
- `error`

## Request validation

- Zod schemas in shared package (`packages/shared-zod`) are reused across services.
- Invalid payloads should return structured 4xx errors.
