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
  │ ◄──────────────────────────────────│    (server push, bất kỳ lúc nào)
```

## Multi-Instance Scaling

```
Client A ──► Pod 1 ──┐
                      ├──► Valkey (Pub/Sub) ──► Pod 2 ──► Client B
Client C ──► Pod 2 ──┘
```

Valkey đảm bảo `SendToUser("B", ...)` từ Pod 1 vẫn tới Client B đang kết nối ở Pod 2.

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
| Message format | `Uint8Array` | Hỗ trợ text, JSON, protobuf, binary |
| Message routing | String-based `msgType` | Đơn giản, tương tự REST routes |
| Transport | WS + LP fallback | WS cho performance, LP cho compatibility |
| Database | Pluggable (Postgres/DynamoDB) | Swap implementation qua import |
| Scaling | Valkey Pub/Sub | Sync messages giữa các instance |
| Auth | Callback-based `InspectToken` | Không lock-in auth strategy |
