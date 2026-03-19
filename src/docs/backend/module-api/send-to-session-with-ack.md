# SendToSessionWithAck

Send a message to a specific session and **wait for client acknowledgment**:

```go
acked, aErr := h.i.Services().SendToSessionWithAck(ctx, "user-123", "session-abc", "payment_update", payload, 5*time.Second)
if !acked {
    // Client did not acknowledge within 5 seconds — retry or fallback
}
```

The server sends the message with an `ackId` field. The client must respond with a message of type `__ack__` containing that `ackId`.

> **Note:** ACK only works for connections on the **same container**. In multi-container deployments, `SendToSessionWithAck` must be called on the container that owns the session.
