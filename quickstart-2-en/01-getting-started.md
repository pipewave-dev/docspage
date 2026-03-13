# Getting Started

EchoWave provides a WebSocket server (Go) with auto-fallback to Long Polling, along with a React SDK. Supports PostgreSQL or DynamoDB.

## Requirements

- Docker & Docker Compose
- Go 1.25+
- Node.js 18+

## Architecture

```
Client (React) ←— WS/LP —→ Backend (Go) ←→ Valkey (Pub/Sub)
                                         ←→ PostgreSQL / DynamoDB
```

- **Valkey**: Pub/Sub between backend instances (horizontal scaling)
- **Database**: Stores active connections, user/group, notifications, FCM devices

## Quick Run

```bash
# Terminal 1: Infrastructure + Backend
cd echowave-backend
docker compose up -d      # PostgreSQL (:29102) + Valkey (:29100)
go run ./playground        # Backend (:8080)

# Terminal 2: Frontend
cd echowave-femodule
npm install
npm run dev               # Vite dev server (:5173)
```

Open http://localhost:5173 → enter a token (which is the username in the playground) → Send message.

Enter `userxxx` as the token then Reconnect → receive server push every 6 seconds (the playground sends to user `"userxxx"`).
