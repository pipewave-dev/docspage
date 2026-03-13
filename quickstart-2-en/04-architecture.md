# Architecture

## Message Flow

```
Client                              Server
  │                                    │
  │  WS connect (token)                │
  │ ──────────────────────────────────►│  InspectToken(token) → username
  │                                    │
  │  status: READY                     │
  │ ◄──────────────────────────────────│
  │                                    │
  │  send({ msgType, data })           │
  │ ──────────────────────────────────►│  HandleMessage(auth, msgType, data)
  │                                    │    → (outputType, response)
  │  onMessage[outputType](response)   │
  │ ◄──────────────────────────────────│
  │                                    │
  │  onMessage[type](data)             │  SendToUser(username, type, data)
  │ ◄──────────────────────────────────│    (server push, at any time)
```

## Multi-Instance Scaling

```
Client A ──► Pod 1 ──┐
                      ├──► Valkey (Pub/Sub) ──► Pod 2 ──► Client B
Client C ──► Pod 2 ──┘
```

Valkey ensures that `SendToUser("B", ...)` from Pod 1 still reaches Client B connected on Pod 2.

## Project Structure

```
echowave-backend/
├── playground/
│   ├── main.go              # Entry point — implement InspectToken + HandleMessage
│   └── config.yaml          # Playground-specific config
├── config.yaml              # Main config (PostgreSQL, Valkey, CORS)
├── docker-compose.yml       # PostgreSQL + Valkey
├── app/                     # Wire DI
├── core/                    # Business logic, repository interfaces
│   └── repository/
│       ├── impl-postgres/   # PostgreSQL implementation
│       └── impl-dynamodb/   # DynamoDB implementation
└── provider/                # Config, Queue providers

echowave-femodule/
├── src/
│   ├── context/
│   │   ├── provider.tsx     # PipewaveProvider
│   │   └── types.ts         # PipewaveModuleConfig
│   ├── hooks/
│   │   └── usePipewave.ts   # usePipewave hook
│   ├── external/pipewave/   # WS/LP transport layer
│   └── pages/
│       └── Example.tsx      # Demo page
└── package.json             # @ponos/echowave — exports ./context, ./hooks
```

## Key Design Decisions

| Aspect | Choice | Rationale |
|---|---|---|
| Message format | `Uint8Array` | Supports text, JSON, protobuf, binary |
| Message routing | String-based `msgType` | Simple, similar to REST routes |
| Transport | WS + LP fallback | WS for performance, LP for compatibility |
| Database | Pluggable (Postgres/DynamoDB) | Swap implementation via import |
| Scaling | Valkey Pub/Sub | Sync messages across instances |
| Auth | Callback-based `InspectToken` | No lock-in to auth strategy |
