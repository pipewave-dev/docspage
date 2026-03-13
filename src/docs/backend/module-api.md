# Module API

The `delivery.ModuleDelivery` interface is the main entry point exposed by Pipewave. It provides access to messaging services, monitoring, health checks, and connection lifecycle hooks.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

## Overview

```go
type ModuleDelivery interface {
    SetFns(fns *configprovider.Fns)

    Mux() *http.ServeMux
    Services() ExportedServices
    Monitoring() business.Monitoring
    IsHealthy() bool
    Shutdown()
}
```

Inside your handler, embed `delivery.ModuleDelivery` to access all capabilities:

```go
type handleMsg struct {
    i delivery.ModuleDelivery
}
```

---

## Services

`pw.Services()` returns the `ExportedServices` interface for sending messages and managing connections.

### SendToUser

Send a message to **all active connections** of a specific user (across all instances):

```go
aErr := h.i.Services().SendToUser(ctx, userID, msgType, payload)
```

**How it works:**
1. Pipewave looks up all active sessions for the given `userID`
2. If the user is on the **current instance**, the message is delivered directly
3. If the user is on a **different instance**, the message is published via PubSub (Valkey/Redis)
4. All devices/tabs of that user receive the message simultaneously

**Example:**

```go
import "github.com/vmihailenco/msgpack/v5"

data, _ := msgpack.Marshal(NotificationPayload{
    Title: "Order Shipped",
    Body:  "Your order #1234 has been shipped",
})
aErr := h.i.Services().SendToUser(ctx, "user_123", "ORDER_UPDATE", data)
```

---

### SendToSession

Send a message to a **specific connection session** of a user (by `instanceID`):

```go
aErr := h.i.Services().SendToSession(ctx, userID, instanceID, msgType, payload)
```

Use this when you need to target a specific tab or device rather than all connections of a user.

---

### SendToAnonymous

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

---

### PingConnections

Actively ping all connected clients to verify liveness. Removes sessions that do not respond:

```go
h.i.Services().PingConnections()
```

> **Note:** This does not work for long-polling connections. Browsers automatically respond with Pong when the tab is active, the page is not suspended, and the WebSocket connection is open.

---

### CheckOnline

Check if a specific user has any active connections:

```go
isOnline, aErr := h.i.Services().CheckOnline(ctx, "user_123")
if !isOnline {
    // User is not connected
}
```

---

### OnNewRegister

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

---

### OnCloseRegister

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

---

## Monitoring

`pw.Monitoring()` returns the `Monitoring` interface for observing connection and system state.

### InsideActiveConnection

Get connection stats for **the current instance only** (not other instances behind the load balancer):

```go
summary, aErr := h.i.Monitoring().InsideActiveConnection(ctx)
// summary.AnonymosConnection — number of unauthenticated connections
// summary.UserConnection     — number of authenticated connections
// summary.TotalUser          — number of distinct authenticated users
```

### TotalActiveConnection

Get the **total number of authenticated connections** across **all instances**:

```go
total, aErr := h.i.Monitoring().TotalActiveConnection(ctx)
```

### WorkerPoolStats

Get the current state of the internal worker pool:

```go
stats, aErr := h.i.Monitoring().WorkerPoolStats(ctx)
// stats.Length   — current number of jobs in the pool
// stats.Capacity — maximum capacity of the pool
```

**Example — exposing metrics via an HTTP endpoint:**

```go
http.HandleFunc("/internal/stats", func(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    inside, _ := pw.Monitoring().InsideActiveConnection(ctx)
    total, _  := pw.Monitoring().TotalActiveConnection(ctx)
    pool, _   := pw.Monitoring().WorkerPoolStats(ctx)

    fmt.Fprintf(w, "inside: %s\ntotal: %d\npool: %s\n",
        inside.String(), total, pool.String())
})
```

---

## IsHealthy

Check whether the Pipewave instance is fully initialized and ready to handle connections:

```go
if pw.IsHealthy() {
    // Instance is ready
}
```

Useful for Kubernetes readiness probes or health check endpoints:

```go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    if !pw.IsHealthy() {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
})
```

---

## Shutdown

Gracefully shut down Pipewave — closes all connections and releases resources:

```go
pw.Shutdown()
```

Call this during your application's graceful shutdown sequence, typically in response to OS signals:

```go
signalChan := make(chan os.Signal, 1)
signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)
<-signalChan

pw.Shutdown()
```
