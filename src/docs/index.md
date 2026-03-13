# Getting Started

Pipewave is a high-performance WebSocket & Long-Polling engine designed for modern web applications. It provides a seamless, production-ready module for both **Go backends** and **React/TypeScript frontends**.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Go** | 1.21+ | Backend runtime |
| **Node.js** | 18+ | Frontend build toolchain |
| **React** | 18+ or 19 | Frontend framework |
| **TypeScript** | 5.0+ | Recommended, not required |
| **Valkey / Redis** | 7.0+ | PubSub for multi-instance (optional for single instance) |
| **PostgreSQL** | 14+ | Connection store (or DynamoDB via adapter) |

## Why Pipewave?

- **Multiplexed Protocol** — Send typed messages (`Type` + binary `Data`) over a single connection
- **User-Based Addressing** — Send to users, not connections. All devices receive the message automatically
- **Horizontally Scalable** — No sticky sessions. Built-in PubSub broadcast across multiple instances
- **High Performance** — Binary framing with MessagePack, kernel-level socket management (kqueue/epoll)
- **Automatic Resilience** — Built-in heartbeat, auto-reconnect, and Long Polling fallback
- **React First-Class** — `usePipewave()` hook with reactive status and typed event handlers

### How Does Pipewave Compare?

| Feature | Pipewave | Socket.io | Centrifugo | Pusher |
|---------|----------|-----------|------------|--------|
| **Protocol** | Binary (MessagePack) | JSON + Binary | JSON + Protobuf | JSON |
| **Addressing** | User-based | Connection-based | Channel-based | Channel-based |
| **Backend Language** | Go | Node.js | Go | Hosted / Multi |
| **Frontend SDK** | React Hook | Framework-agnostic | Framework-agnostic | Framework-agnostic |
| **Sticky Sessions** | Not required | Required (default) | Not required | N/A (hosted) |
| **Long Polling Fallback** | Automatic | Automatic | SockJS option | Automatic |
| **Self-hosted** | Yes | Yes | Yes | No (SaaS) |
| **Multiplexed Types** | Built-in | Manual namespaces | Channels | Channels |

Pipewave is ideal when you need **user-based messaging** with a **Go backend** and **React frontend**, with binary performance and horizontal scaling out of the box.

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

- Read the [Core Concepts](/docs/concepts) to understand how Pipewave works
- Follow the [Tutorial](/docs/tutorial) to build a complete chat app end-to-end
- Follow the [Backend Quick Start](/docs/backend/quick-start) to set up your Go server
- Follow the [Frontend Quick Start](/docs/frontend/quick-start) to wire up your React app
- Read the [Architecture](/docs/architecture) overview for deep technical details
