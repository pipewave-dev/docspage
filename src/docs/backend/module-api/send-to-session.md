# SendToSession

Send a message to a **specific connection session** of a user (by `instanceID`):

```go
aErr := h.i.Services().SendToSession(ctx, userID, instanceID, msgType, payload)
```

Use this when you need to target a specific tab or device rather than all connections of a user.
