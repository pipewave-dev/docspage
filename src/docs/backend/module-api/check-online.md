# CheckOnline

Check if a specific user has any active connections:

```go
isOnline, aErr := h.i.Services().CheckOnline(ctx, "user_123")
if !isOnline {
    // User is not connected
}
```
