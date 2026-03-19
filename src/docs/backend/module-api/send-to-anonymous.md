# SendToAnonymous

Send a message to **unauthenticated (anonymous) connections**:

```go
aErr := h.i.Services().SendToAnonymous(ctx, msgType, payload, isSendAll, instanceID)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `msgType` | `string` | The message type identifier |
| `payload` | `[]byte` | Binary payload (typically MessagePack-encoded) |
| `isSendAll` | `bool` | `true` to broadcast to all anonymous connections |
| `instanceID` | `[]string` | Target specific instances when `isSendAll` is `false` |
