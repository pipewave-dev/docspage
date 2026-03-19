# OnNewRegister

Register callbacks to be invoked when a **new WebSocket connection** is established:

```go
onNew := h.i.Services().OnNewRegister()

onNew.Register("my-key", func(conn wsSv.WebsocketConn) error {
    // Called each time a new connection is opened
    return nil
})

// Remove the callback when no longer needed
onNew.Deregister("my-key")
```

Each registered callback receives the new `WebsocketConn`. Returning an error from the callback rejects the connection.
