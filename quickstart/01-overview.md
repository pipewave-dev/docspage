# EchoWave - Tổng quan

## EchoWave là gì?

EchoWave (hay Pipewave) là một hệ thống **realtime communication** gồm 2 phần:

- **Backend** (Golang): Cung cấp WebSocket server và Long Polling fallback, hỗ trợ gửi/nhận message realtime giữa server và client.
- **Frontend module** (TypeScript/React): Thư viện React giúp kết nối tới backend qua WebSocket, tự động fallback sang Long Polling khi WebSocket không khả dụng.

## Kiến trúc tổng quan

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
                                                             │    (hoặc DynamoDB)│
                                                             │  - Valkey (Redis) │
                                                             └──────────────────┘
```

## Luồng hoạt động

1. **Client** kết nối tới backend qua WebSocket (hoặc Long Polling).
2. Client gửi **access token** để xác thực. Backend gọi hàm `InspectToken` do bạn tự định nghĩa để xác minh token → trả về username.
3. Sau khi xác thực, client có thể **gửi message** lên server. Backend gọi hàm `HandleMessage` do bạn tự định nghĩa để xử lý → trả kết quả về client.
4. Backend cũng có thể **chủ động gửi message** tới client bất cứ lúc nào (server push) thông qua `SendToUser`.

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Mục đích |
|---------|---------------------|----------|
| **Docker** + Docker Compose | Docker 20+ | Chạy PostgreSQL và Valkey |
| **Go** | 1.25+ | Chạy backend |
| **Node.js** + npm | Node 18+ | Chạy frontend (nếu dùng example) |

> **Lưu ý:** Bạn không cần biết Golang hay TypeScript để chạy thử. Chỉ cần cài đặt các công cụ trên và làm theo hướng dẫn.

## Tiếp theo

- [02 - Cài đặt môi trường](./02-setup.md)
- [03 - Chạy Backend](./03-backend.md)
- [04 - Chạy Frontend](./04-frontend.md)
- [05 - Hiểu cách hoạt động](./05-how-it-works.md)
- [06 - Tuỳ chỉnh cho dự án của bạn](./06-customization.md)
