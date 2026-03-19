# InspectToken Function

The `InspectToken` function is called when a client initiates a WebSocket upgrade or Long Polling session. It's your bridge between Pipewave and your authentication system.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

## Signature

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (username string, isAnonymous bool, metadata map[string]string, err error)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `context.Context` | Request context |
| `token` | `string` | The access token sent by the client (may include "Bearer " prefix) |
| `headers` | `http.Header` | Full HTTP headers of the upgrade request — read custom headers (device type, app version, etc.) directly here |

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `username` | `string` | Unique user identifier. All connections with the same username are grouped together |
| `isAnonymous` | `bool` | If `true`, the connection is treated as anonymous (limited rate) |
| `metadata` | `map[string]string` | Optional key-value pairs attached to this connection. Accessible later via `auth.Metadata` in handlers |
| `err` | `error` | Return an error to reject the connection |

## Registration

Register the function via `SetFns`:

```go
pw.SetFns(&configprovider.Fns{
    InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
        // Your token validation logic
        return userID, false, nil, nil
    },
    // ...other functions
})
```

## Example: Simple Token (Demo)

For development or demo purposes, treat the token directly as the username:

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
    token = strings.TrimSpace(token)
    token = strings.TrimPrefix(token, "Bearer ")
    return strings.TrimSpace(token), false, nil, nil
},
```

## Example: JWT Validation

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
    claims, err := jwt.ValidateToken(token)
    if err != nil {
        return "", false, nil, fmt.Errorf("invalid token: %w", err)
    }
    return claims.UserID, false, nil, nil
},
```

## Example: JWT with Connection Metadata

Read custom HTTP headers to attach device and version information to the connection:

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
    claims, err := jwt.ValidateToken(token)
    if err != nil {
        return "", false, nil, fmt.Errorf("invalid token: %w", err)
    }
    metadata := map[string]string{
        "device":      headers.Get("X-Device-Type"),  // e.g. "ios", "android", "web"
        "app_version": headers.Get("X-App-Version"),  // e.g. "2.1.0"
    }
    return claims.UserID, false, metadata, nil
},
```

Metadata is accessible in your `HandleMessage` callbacks via `auth.Metadata`:

```go
func (h *myHandler) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, msgType string, data []byte) error {
    device := auth.Metadata["device"]      // "ios"
    version := auth.Metadata["app_version"] // "2.1.0"
    // ...
}
```

## Example: API Key Lookup

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
    user, err := db.FindUserByAPIKey(ctx, token)
    if err != nil {
        return "", false, nil, err
    }
    return user.ID, false, nil, nil
},
```

## Anonymous Connections

If you want to allow anonymous connections (e.g., for public dashboards):

```go
InspectToken: func(ctx context.Context, token string, headers http.Header) (userID string, isAnonymous bool, metadata map[string]string, err error) {
    if token == "" || token == "anonymous" {
        anonymousID := fmt.Sprintf("anon_%s", uuid.New().String())
        return anonymousID, true, nil, nil
    }
    // Normal auth flow...
    userID, isAnon, err := validateToken(token)
    return userID, isAnon, nil, err
},
```

## Important Notes

- The `username` returned is used as the **User ID** throughout Pipewave. `SendToUser` targets this value
- A single user can have multiple active connections (multiple tabs, devices). All connections with the same username receive broadcasts
- Returning an error will reject the connection with an appropriate HTTP status code
- `metadata` is stored per-connection in `WebsocketAuth.Metadata` — return `nil` if not needed
- `headers` contains the full HTTP headers of the original upgrade request, so you can read any custom headers without adding middleware
