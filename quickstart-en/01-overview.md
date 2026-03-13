# EchoWave - Overview

## What is EchoWave?

EchoWave (or Pipewave) is a **realtime communication** system consisting of 2 parts:

- **Backend** (Golang): Provides a WebSocket server with Long Polling fallback, supporting realtime message exchange between server and client.
- **Frontend module** (TypeScript/React): A React library that connects to the backend via WebSocket, with automatic fallback to Long Polling when WebSocket is unavailable.

## Architecture Overview

```
┌─────────────────┐         WebSocket / Long Polling         ┌──────────────────┐
│                 │ ◄──────────────────────────────────────► │                  │
│  React Frontend │                                          │  Golang Backend  │
│  (echowave-     │         HTTP :8080                       │  (echowave-      │
│   femodule)     │ ◄──────────────────────────────────────► │   backend)       │
│                 │                                          │                  │
└─────────────────┘                                          └────────┬─────────┘
                                                                      │
                                                             ┌────────┴─────────┐
                                                             │   Infrastructure │
                                                             │                  │
                                                             │  - PostgreSQL    │
                                                             │    (or DynamoDB) │
                                                             │  - Valkey (Redis) │
                                                             └──────────────────┘
```

## How It Works

1. **Client** connects to the backend via WebSocket (or Long Polling).
2. Client sends an **access token** for authentication. The backend calls the `InspectToken` function (defined by you) to verify the token and return a username.
3. After authentication, the client can **send messages** to the server. The backend calls the `HandleMessage` function (defined by you) to process the message and return a result to the client.
4. The backend can also **proactively send messages** to the client at any time (server push) via `SendToUser`.

## System Requirements

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| **Docker** + Docker Compose | Docker 20+ | Run PostgreSQL and Valkey |
| **Go** | 1.25+ | Run the backend |
| **Node.js** + npm | Node 18+ | Run the frontend (if using the example) |

> **Note:** You don't need to know Golang or TypeScript to try it out. Just install the tools above and follow the guide.

## Next Steps

- [02 - Environment Setup](./02-setup.md)
- [03 - Running the Backend](./03-backend.md)
- [04 - Running the Frontend](./04-frontend.md)
- [05 - How It Works](./05-how-it-works.md)
- [06 - Customization](./06-customization.md)
