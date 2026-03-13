# Getting Started

Pipewave is a high-performance WebSocket & Long-Polling engine designed for modern web applications. It provides a seamless, production-ready module for both **Go backends** and **React/TypeScript frontends**.

## Why Pipewave?

- **Multiplexed Protocol** — Send typed messages (`Type` + binary `Data`) over a single connection
- **User-Based Addressing** — Send to users, not connections. All devices receive the message automatically
- **Horizontally Scalable** — No sticky sessions. Built-in PubSub broadcast across multiple instances
- **High Performance** — Binary framing with MessagePack, kernel-level socket management (kqueue/epoll)
- **Automatic Resilience** — Built-in heartbeat, auto-reconnect, and Long Polling fallback
- **React First-Class** — `usePipewave()` hook with reactive status and typed event handlers

## Quick Overview

### Backend (Go)

```go
config := configprovider.FromYaml([]string{".config.yaml"}, &configprovider.Fns{
    InspectToken: func(ctx context.Context, token string) (string, bool, error) {
        return validateToken(token)
    },
    HandleMessage: func(ctx context.Context, auth Auth, msgType string, data []byte) (string, []byte, error) {
        return "RESPONSE", processMessage(msgType, data), nil
    },
})

di := app.NewPipewave(config)
http.ListenAndServe(":8080", di.Delivery.Mux())
```

### Frontend (React)

```tsx
const { status, send } = usePipewave({
    CHAT_MESSAGE: async (data) => handleChat(data),
    NOTIFICATION: async (data) => showToast(data),
})
```

## Next Steps

- Read the [Architecture](/docs/architecture) overview to understand the system design
- Follow the [Backend Quick Start](/docs/backend/quick-start) to set up your Go server
- Follow the [Frontend Quick Start](/docs/frontend/quick-start) to wire up your React app
