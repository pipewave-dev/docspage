# Broadcast

Broadcast a message to **all connected clients**, with optional filtering by authentication state:

```go
import "github.com/pipewave-dev/go-pkg/core/delivery"

// All connections (authenticated + anonymous)
aErr := h.i.Services().Broadcast(ctx, delivery.BroadcastAll, "maintenance", payload)

// Authenticated users only
aErr := h.i.Services().Broadcast(ctx, delivery.BroadcastAuthOnly, "feature_update", payload)

// Anonymous connections only
aErr := h.i.Services().Broadcast(ctx, delivery.BroadcastAnonOnly, "signup_promo", payload)
```

**`BroadcastTarget` values:**

| Constant | Description |
|----------|-------------|
| `delivery.BroadcastAll` | All connections (authenticated + anonymous) |
| `delivery.BroadcastAuthOnly` | Authenticated users only |
| `delivery.BroadcastAnonOnly` | Anonymous connections only |

Broadcast goes through pub/sub and works correctly in multi-container deployments.
