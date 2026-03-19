# CheckOnlineMultiple

Check the online status of **multiple users at once** in a single database query:

```go
statuses, aErr := h.i.Services().CheckOnlineMultiple(ctx, []string{"user-1", "user-2", "user-3"})
// statuses = map[string]bool{"user-1": true, "user-2": false, "user-3": true}
```

More efficient than calling `CheckOnline` in a loop — PostgreSQL uses a single `WHERE user_id = ANY($1)` query; DynamoDB queries each user in parallel.
