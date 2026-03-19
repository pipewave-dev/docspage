# SendToUsers

Send a message to **multiple users at once** with a single pub/sub publish:

```go
userIDs := []string{"user-1", "user-2", "user-3"}
aErr := h.i.Services().SendToUsers(ctx, userIDs, "team_update", payload)
```

More efficient than calling `SendToUser` in a loop — the payload is serialized once and delivered to all target users. Each user receives the message on all their active sessions.
