# Getting Started

EchoWave cung cấp WebSocket server (Go) với auto-fallback sang Long Polling, kèm React SDK. Hỗ trợ PostgreSQL hoặc DynamoDB.

## Yêu cầu

- Docker & Docker Compose
- Go 1.25+
- Node.js 18+

## Kiến trúc

```
Client (React) ←— WS/LP —→ Backend (Go) ←→ Valkey (Pub/Sub)
                                         ←→ PostgreSQL / DynamoDB
```

- **Valkey**: Pub/Sub giữa các backend instance (horizontal scaling)
- **Database**: Lưu active connections, user/group, notifications, FCM devices

## Chạy nhanh

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

Mở http://localhost:5173 → nhập token (chính là username trong playground) → Send message.

Nhập `userxxx` làm token rồi Reconnect → nhận server push mỗi 6 giây (playground gửi tới user `"userxxx"`).
