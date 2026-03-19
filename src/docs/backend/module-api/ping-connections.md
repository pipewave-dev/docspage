# PingConnections

Actively ping all connected clients to verify liveness. Removes sessions that do not respond:

```go
h.i.Services().PingConnections()
```

> **Note:** This does not work for long-polling connections. Browsers automatically respond with Pong when the tab is active, the page is not suspended, and the WebSocket connection is open.
