# How It Works

## Message Flow: Client → Server → Client

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
│ (React)  │                              │ (Golang) │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  1. WebSocket connect (send token)      │
     │ ───────────────────────────────────────► │
     │                                         │  2. InspectToken(token)
     │                                         │     → username
     │  3. Connection successful (status: READY)│
     │ ◄─────────────────────────────────────── │
     │                                         │
     │  4. send({ msgType: "ECHO",             │
     │           data: "hello" })              │
     │ ───────────────────────────────────────► │
     │                                         │  5. HandleMessage("ECHO", "hello")
     │                                         │     → ("ECHO_RESPONSE", "Got [hello]...")
     │  6. onMessage["ECHO_RESPONSE"](data)    │
     │ ◄─────────────────────────────────────── │
     │                                         │
     │                                         │  7. SendToUser("userxxx", "ECHO_RESPONSE", data)
     │  8. onMessage["ECHO_RESPONSE"](data)    │     (server push - at any time)
     │ ◄─────────────────────────────────────── │
     │                                         │
```

---

## What is Message Type?

Message Type (`msgType`) is a string used to **classify messages**. It works similarly to "routes" in a REST API.

**Practical examples:**

| msgType (Client sends) | msgType (Server returns) | Description |
|------------------------|--------------------------|-------------|
| `"CHAT_SEND"` | `"CHAT_NEW"` | Send a chat message |
| `"TYPING_START"` | `"TYPING_INDICATOR"` | Notify typing status |
| `"READ_RECEIPT"` | — (no response) | Mark as read |

**Backend** receives `inputType` and returns `outputType`:

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    switch inputType {
    case "CHAT_SEND":
        // Process chat...
        return "CHAT_NEW", responseData, nil

    case "TYPING_START":
        // Broadcast typing indicator...
        return "TYPING_INDICATOR", typingData, nil

    case "READ_RECEIPT":
        // Save to DB, no response needed for client
        return "", nil, nil

    default:
        return "", nil, fmt.Errorf("unknown message type: %s", inputType)
    }
}
```

**Frontend** registers handlers for each type:

```tsx
const onMessage: OnMessage = useMemo(() => ({
    'CHAT_NEW': async (data, id) => {
        // Display new message
    },
    'TYPING_INDICATOR': async (data, id) => {
        // Show "typing..."
    },
}), [])
```

---

## Authentication

### Authentication Flow

1. Frontend calls `getAccessToken()` to get a token
2. The token is sent when connecting via WebSocket
3. Backend calls `InspectToken(token)` → returns `username`
4. All subsequent messages are associated with this `username`

### In Playground (simplified)

```go
// Token is the username itself
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    return trimToken(token), false, nil
},
```

### In Production (example with JWT)

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    claims, err := verifyJWT(token)
    if err != nil {
        return "", false, fmt.Errorf("invalid token: %w", err)
    }
    return claims.Username, false, nil
},
```

---

## WebSocket vs Long Polling

EchoWave supports 2 transports:

| | WebSocket | Long Polling |
|---|----------|-------------|
| **Mechanism** | Persistent two-way connection | Client sends HTTP request, server holds until data is available |
| **Advantages** | Realtime, low overhead | Works through any firewall/proxy |
| **Disadvantages** | May be blocked by some proxies | Slower, higher bandwidth usage |

### Automatic Fallback Mechanism

```
Attempt 1: Try WebSocket → Failed
Attempt 2: Try WebSocket → Failed
Attempt 3: Try WebSocket → Failed (max retries reached)
  ↓
Automatically switch to Long Polling
  ↓
Long Polling connects successfully → Saved to sessionStorage
  ↓
Subsequent connections in the same session → Use Long Polling directly (no WS attempts)
```

---

## Role of Valkey

**Valkey** (Redis-compatible) is used as a message queue for:

1. **Synchronizing messages across multiple backend instances**: When deploying multiple pods/instances, a message sent to pod A needs to be delivered to a user connected on pod B.
2. **Pub/Sub**: The backend uses Valkey pub/sub to broadcast messages between instances.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client 1 │────►│ Pod A    │     │ Pod B    │◄───│ Client 2 │
└──────────┘     └────┬─────┘     └────┬─────┘   └──────────┘
                      │                │
                      └───► Valkey ◄───┘
                        (Pub/Sub)
```

> **In local environments**, there's only 1 backend instance so Valkey is mainly used for internal messaging. But when deploying to production with multiple instances, Valkey ensures messages reach the right user.

---

## Role of PostgreSQL / DynamoDB

The database is used to store:

- **Active connections**: Information about active connections
- **User / Group**: User and group management
- **Notifications**: Notification history
- **FCM Devices**: Firebase Cloud Messaging tokens (for mobile push notifications)

> In this Quick Start, the backend auto-creates the necessary tables thanks to `CREATE_TABLES: true` in the config.

---

## Next

→ [06 - Customization](./06-customization.md)
