# GetUserSessions

Get the details of all active connections for a specific user:

```go
sessions, aErr := h.i.Services().GetUserSessions(ctx, "user-123")
// sessions = []delivery.SessionInfo{
//   {InstanceID: "tab-1", ConnectedAt: time.Time{...}, IsAnonymous: false},
//   {InstanceID: "mobile-1", ConnectedAt: time.Time{...}, IsAnonymous: false},
// }
```

**`SessionInfo` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `InstanceID` | `string` | Session / instance identifier |
| `ConnectedAt` | `time.Time` | When this connection was established |
| `IsAnonymous` | `bool` | Whether the connection is anonymous |
