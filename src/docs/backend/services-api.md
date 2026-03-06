# Services API

The Services API provides server-side methods to push messages to connected users and check user online status.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

## Accessing Services

The `delivery.ModuleDelivery` interface (the Pipewave instance) provides access to the Services API:

```go
// Inside your handler
type handleMsg struct {
    i delivery.ModuleDelivery
}

// Access services via the interface
h.i.Services().SendToUser(ctx, userID, msgType, data)
h.i.Services().CheckOnline(ctx, userID)
```

## SendToUser

Send a message to all active connections of a specific user:

```go
func (s *Services) SendToUser(
    ctx context.Context,
    userID string,
    eventType string,
    payload []byte,
) error
```

### Example

```go
import "github.com/vmihailenco/msgpack/v5"

// Send a notification to a specific user
data, _ := msgpack.Marshal(NotificationPayload{
    Title: "Order Shipped",
    Body:  "Your order #1234 has been shipped",
})
err := h.i.Services().SendToUser(ctx, "user_123", "ORDER_UPDATE", data)
```

### How it works

1. Pipewave looks up all active connections for the given `userID`
2. If the user is connected to the **current instance**, the message is delivered directly
3. If the user is connected to a **different instance**, the message is published via PubSub (Valkey/Redis)
4. The receiving instance picks up the message and delivers it to the user's socket
5. All devices/tabs of that user receive the message simultaneously

## CheckOnline

Check if a specific user has any active connections:

```go
isOnline, err := h.i.Services().CheckOnline(ctx, "user_123")
if !isOnline {
    // User is not connected
}
```

## Shutdown

Gracefully shut down Pipewave (closes all connections and releases resources):

```go
pw.Shutdown()
```

This should be called during your application's graceful shutdown sequence, typically in response to OS signals (SIGTERM, SIGINT):

```go
signalChan := make(chan os.Signal, 1)
signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)
<-signalChan

pw.Shutdown()
```
