# InspectToken Function

The `InspectToken` function is called when a client initiates a WebSocket upgrade or Long Polling session. It's your bridge between Pipewave and your authentication system.

## Signature

```go
InspectToken: func(ctx context.Context, token string) (username string, isAnonymous bool, err error)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `context.Context` | Request context |
| `token` | `string` | The access token sent by the client |

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `username` | `string` | Unique user identifier. All connections with the same username are grouped together |
| `isAnonymous` | `bool` | If `true`, the connection is treated as anonymous (limited capabilities) |
| `err` | `error` | Return an error to reject the connection |

## Example: JWT Validation

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    claims, err := jwt.ValidateToken(token)
    if err != nil {
        return "", false, fmt.Errorf("invalid token: %w", err)
    }
    return claims.UserID, false, nil
},
```

## Example: API Key Lookup

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    user, err := db.FindUserByAPIKey(ctx, token)
    if err != nil {
        return "", false, err
    }
    return user.ID, false, nil
},
```

## Anonymous Connections

If you want to allow anonymous connections (e.g., for public dashboards):

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    if token == "" || token == "anonymous" {
        anonymousID := fmt.Sprintf("anon_%s", uuid.New().String())
        return anonymousID, true, nil
    }
    // Normal auth flow...
    return validateToken(token)
},
```

## Important Notes

- The `username` returned is used as the **User ID** throughout Pipewave. `SendToUser` targets this value
- A single user can have multiple active connections (multiple tabs, devices). All connections with the same username receive broadcasts
- Returning an error will reject the connection with an appropriate HTTP status code
