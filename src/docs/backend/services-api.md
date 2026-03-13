# Services API

The Services API provides server-side methods to push messages to connected users from anywhere in your backend code.

## Accessing Services

```go
di := app.NewPipewave(config)
ws := di.Delivery.Services().Websocket()
```

## SendToUser

Send a message to all active connections of a specific user:

```go
func (ws *WebsocketService) SendToUser(
    ctx context.Context,
    userID string,
    eventType string,
    payload []byte,
)
```

### Example

```go
// Send a notification to a specific user
ws.SendToUser(ctx, "user_123", "NOTIFICATION", []byte(`{"title":"New message"}`))

// With MessagePack encoding
data, _ := msgpack.Marshal(NotificationPayload{
    Title: "Order Shipped",
    Body:  "Your order #1234 has been shipped",
})
ws.SendToUser(ctx, userID, "ORDER_UPDATE", data)
```

### How it works

1. Pipewave looks up all active connections for the given `userID`
2. If the user is connected to the **current instance**, the message is delivered directly
3. If the user is connected to a **different instance**, the message is published via PubSub
4. The receiving instance picks up the message and delivers it to the user's socket
5. All devices/tabs of that user receive the message simultaneously

## Monitoring

Access connection monitoring utilities:

```go
monitor := di.Delivery.Services().Monitor()

// Get active connection count
count := monitor.ActiveConnections()

// Check if a specific user is online
isOnline := monitor.IsUserOnline(ctx, "user_123")
```

## Shutdown

Gracefully shut down Pipewave (closes all connections and releases resources):

```go
di.Delivery.Shutdown()
```

This should be called during your application's graceful shutdown sequence, typically in response to OS signals (SIGTERM, SIGINT).
