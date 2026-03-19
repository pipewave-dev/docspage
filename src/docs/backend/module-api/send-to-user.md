# SendToUser

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
