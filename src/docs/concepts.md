# Core Concepts

Before diving into APIs and configuration, it helps to understand how Pipewave works at a high level.

## How Pipewave Works

Pipewave sits between your frontend and backend, managing real-time connections for you. Here's the basic flow:

```
┌────────┐  1. Connect + Token   ┌──────────┐
│ React  │ ────────────────────► │ Pipewave │
│ Client │                       │ Server   │
│        │ ◄──────────────────── │          │
│        │  4. Push messages     │          │
└────────┘                       └────┬─────┘
                                      │
                          2. Validate   3. Handle
                             Token         Message
                                      │
                               ┌──────▼───────┐
                               │  Your Code   │
                               │              │
                               │ InspectToken │
                               │ HandleMessage│
                               └──────────────┘
```

### Step by Step

1. **Client connects** — The React app opens a WebSocket connection via `PipewaveProvider`, sending an access token
2. **Token validation** — Pipewave calls your `InspectToken` function to verify the token and identify the user
3. **Message routing** — When the client sends a message, Pipewave routes it to your `HandleMessage` function based on the message type
4. **Push to clients** — Your handler can push messages to any user via `Services().SendToUser()`, and Pipewave delivers them across all instances

## The Three Things You Implement

Pipewave handles connection management, heartbeats, reconnection, scaling, and message routing. **You only implement three things:**

### 1. InspectToken — "Who is this user?"

A function that takes a token string and returns the user identity. This is your authentication bridge.

```go
// Your auth logic — validate JWT, check API key, query database, etc.
func inspectToken(ctx context.Context, token string) (userID string, isAnonymous bool, err error) {
    claims, err := validateJWT(token)
    return claims.UserID, false, err
}
```

### 2. HandleMessage — "What do I do with this message?"

An interface that receives typed messages and your business logic decides how to respond.

```go
func (h *handler) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth,
    inputType string, data []byte) (outputType string, res []byte, err error) {
    // inputType tells you WHAT the client wants (e.g., "CHAT_SEND_MSG")
    // data contains the payload
    // Return a response type + data, or "" for no response
}
```

### 3. OnMessage handlers — "What happens when a message arrives on the client?"

A map of message types to handler functions in React.

```tsx
const onMessage: OnMessage = useMemo(() => ({
    CHAT_INCOMING_MSG: async (data: Uint8Array, id: string) => {
        const msg = decode(data) as ChatPayload
        addMessage(msg)
    },
}), [])
```

## Key Design Decisions

### User-Based, Not Connection-Based

Most WebSocket libraries address individual connections. Pipewave addresses **users**. When you call `SendToUser("alice", ...)`, the message reaches Alice on **all her devices** — phone, laptop, tablet — without you tracking connections.

### Multiplexed Messages

Instead of one WebSocket per feature, Pipewave multiplexes everything over a **single connection**. Each message carries a `type` field, so your chat, notifications, and live updates all share one socket:

```
Single WebSocket Connection
  ├── CHAT_INCOMING_MSG    → Chat handler
  ├── NOTIFICATION_NEW     → Notification handler
  └── LIVE_SCORE_UPDATE    → Score handler
```

### Binary by Default

Pipewave uses MessagePack (binary) instead of JSON. This is handled automatically by the SDK — you encode/decode with simple `encode()`/`decode()` calls. The result is 20-50% smaller payloads and faster parsing.

### Automatic Fallback

If WebSocket is blocked (corporate firewalls, VPNs), Pipewave automatically falls back to Long Polling. Your code doesn't change — the same `usePipewave()` hook and `HandleMessage` logic works identically.

## Architecture Overview

For a single instance, the flow is straightforward. For production with multiple instances:

```
Clients ──► Load Balancer ──► Pipewave Instance 1 ──┐
                          ──► Pipewave Instance 2 ──┤──► PubSub (Valkey/Redis)
                          ──► Pipewave Instance 3 ──┘
                                                         │
                                                    Connection Store
                                                   (Postgres/DynamoDB)
```

- **No sticky sessions needed** — Any instance can handle any user
- **PubSub** broadcasts messages across instances (e.g., user on Instance 1 sends to user on Instance 3)
- **Connection Store** tracks which users are online

Read the full [Architecture & Performance](/docs/architecture) guide for deep technical details.

## What's Next

- Follow the [Tutorial](/docs/tutorial) to build a complete chat app
- Set up your [Backend](/docs/backend/quick-start) in 5 minutes
- Set up your [Frontend](/docs/frontend/quick-start) in 5 minutes
