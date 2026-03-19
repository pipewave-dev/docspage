# DisconnectSession

Force-disconnect a **specific session** (tab/device) of a user:

```go
aErr := h.i.Services().DisconnectSession(ctx, "user-123", "instance-abc")
```

Works across multiple containers via pub/sub — the container that owns the connection will close it. The `OnCloseStuffFn` callback is still triggered normally.
