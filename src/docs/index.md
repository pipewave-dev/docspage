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
pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
    ConfigStore:       configprovider.FromGoStruct(pipewave.ConfigEnv{...}),
    RepositoryFactory: postgresRepo.NewPostgresRepo,
    QueueFactory:      queueprovider.QueueValkey,
})

pw.SetFns(&pipewave.FunctionStore{
    InspectToken:  inspectToken,
    HandleMessage: &myHandler{i: pw},
})

http.ListenAndServe(":8080", pw.Mux())
```

### Frontend (React)

```tsx
const onMessage: OnMessage = useMemo(() => ({
    CHAT_INCOMING_MSG: async (data: Uint8Array, id: string) => {
        const payload = decode(data) as ChatIncomingMsg
        // handle message...
    },
}), [])

const { status, send, resetRetryCount } = usePipewave(onMessage)
```

## Resources

| | Link | Version |
|---|---|---|
| **Backend (Go)** | [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg) | `v0.1.0` |
| **Frontend (React)** | [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg) | `v0.1.0` |
| **npm package** | [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) | `v0.1.0` |
| **Examples** | [github.com/pipewave-dev/example](https://github.com/pipewave-dev/example) | — |

## Next Steps

- Read the [Architecture](/docs/architecture) overview to understand the system design
- Follow the [Backend Quick Start](/docs/backend/quick-start) to set up your Go server
- Follow the [Frontend Quick Start](/docs/frontend/quick-start) to wire up your React app
