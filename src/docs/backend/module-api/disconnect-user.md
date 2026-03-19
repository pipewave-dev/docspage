# DisconnectUser

Force-disconnect **all sessions** of a user (all tabs and devices):

```go
aErr := h.i.Services().DisconnectUser(ctx, "user-123")
```

Use for banning users, forced re-authentication, or session hijacking response.
