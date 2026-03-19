# OnCloseRegister

Register callbacks to be invoked when a **WebSocket connection is closed**:

```go
onClose := h.i.Services().OnCloseRegister()

// Register for a specific connection/session
onClose.Register(auth, func(auth voAuth.WebsocketAuth) {
    // Called when this specific connection closes
    // Automatically removed after firing once
})

// Register for ALL connections closing
onClose.RegisterAll(func(auth voAuth.WebsocketAuth) {
    // Called every time any connection closes
})
```

> `Register` fires once and is automatically removed. `RegisterAll` is a persistent global handler.
