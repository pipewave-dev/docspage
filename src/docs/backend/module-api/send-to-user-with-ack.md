# SendToUserWithAck

Send a message to **all sessions** of a user, waiting for acknowledgment from **any one** of them:

```go
acked, aErr := h.i.Services().SendToUserWithAck(ctx, "user-123", "payment_update", payload, 5*time.Second)
```

Returns `acked = true` as soon as any session responds. Useful when the user may have multiple tabs/devices but you only need confirmation from one.

**ACK Protocol:**

Server sends:
```json
{ "t": "payment_update", "a": "ack_xxxxxxxxxxxx", "b": <payload> }
```

Client must respond:
```json
{ "t": "__ack__", "ackId": "ack_xxxxxxxxxxxx" }
```
