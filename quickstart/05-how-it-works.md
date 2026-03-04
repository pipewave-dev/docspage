# Hiểu cách hoạt động

## Luồng message: Client → Server → Client

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
│ (React)  │                              │ (Golang) │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  1. Kết nối WebSocket (gửi token)       │
     │ ───────────────────────────────────────► │
     │                                         │  2. InspectToken(token)
     │                                         │     → username
     │  3. Kết nối thành công (status: READY)  │
     │ ◄─────────────────────────────────────── │
     │                                         │
     │  4. send({ msgType: "ECHO",             │
     │           data: "hello" })              │
     │ ───────────────────────────────────────► │
     │                                         │  5. HandleMessage("ECHO", "hello")
     │                                         │     → ("ECHO_RESPONSE", "Got [hello]...")
     │  6. onMessage["ECHO_RESPONSE"](data)    │
     │ ◄─────────────────────────────────────── │
     │                                         │
     │                                         │  7. SendToUser("userxxx", "ECHO_RESPONSE", data)
     │  8. onMessage["ECHO_RESPONSE"](data)    │     (server push - bất kỳ lúc nào)
     │ ◄─────────────────────────────────────── │
     │                                         │
```

---

## Message Type là gì?

Message Type (`msgType`) là một chuỗi string dùng để **phân loại message**. Nó hoạt động tương tự "route" trong REST API.

**Ví dụ thực tế:**

| msgType (Client gửi) | msgType (Server trả về) | Mô tả |
|----------------------|------------------------|-------|
| `"CHAT_SEND"` | `"CHAT_NEW"` | Gửi tin nhắn chat |
| `"TYPING_START"` | `"TYPING_INDICATOR"` | Thông báo đang gõ |
| `"READ_RECEIPT"` | — (không trả về) | Đánh dấu đã đọc |

**Backend** nhận `inputType` và trả về `outputType`:

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    switch inputType {
    case "CHAT_SEND":
        // Xử lý gửi chat...
        return "CHAT_NEW", responseData, nil

    case "TYPING_START":
        // Broadcast typing indicator...
        return "TYPING_INDICATOR", typingData, nil

    case "READ_RECEIPT":
        // Lưu vào DB, không cần trả về client
        return "", nil, nil

    default:
        return "", nil, fmt.Errorf("unknown message type: %s", inputType)
    }
}
```

**Frontend** đăng ký handler cho từng type:

```tsx
const onMessage: OnMessage = useMemo(() => ({
    'CHAT_NEW': async (data, id) => {
        // Hiển thị tin nhắn mới
    },
    'TYPING_INDICATOR': async (data, id) => {
        // Hiển thị "đang gõ..."
    },
}), [])
```

---

## Xác thực (Authentication)

### Luồng xác thực

1. Frontend gọi `getAccessToken()` để lấy token
2. Token được gửi kèm khi kết nối WebSocket
3. Backend gọi `InspectToken(token)` → trả về `username`
4. Mọi message sau đó đều gắn với `username` này

### Trong Playground (đơn giản)

```go
// Token chính là username
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    return trimToken(token), false, nil
},
```

### Trong Production (ví dụ với JWT)

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    claims, err := verifyJWT(token)
    if err != nil {
        return "", false, fmt.Errorf("invalid token: %w", err)
    }
    return claims.Username, false, nil
},
```

---

## WebSocket vs Long Polling

EchoWave hỗ trợ 2 transport:

| | WebSocket | Long Polling |
|---|----------|-------------|
| **Cơ chế** | Kết nối 2 chiều liên tục | Client gửi HTTP request, server giữ cho đến khi có data |
| **Ưu điểm** | Realtime, ít overhead | Hoạt động qua mọi firewall/proxy |
| **Nhược điểm** | Có thể bị chặn bởi một số proxy | Chậm hơn, tốn bandwidth hơn |

### Cơ chế fallback tự động

```
Lần 1: Thử WebSocket → Thất bại
Lần 2: Thử WebSocket → Thất bại
Lần 3: Thử WebSocket → Thất bại (hết max retry)
  ↓
Tự động chuyển sang Long Polling
  ↓
Long Polling kết nối thành công → Lưu vào sessionStorage
  ↓
Các lần sau trong cùng session → Dùng luôn Long Polling (không thử WS nữa)
```

---

## Vai trò của Valkey

**Valkey** (tương thích Redis) được dùng làm message queue để:

1. **Đồng bộ message giữa nhiều instance backend**: Khi deploy nhiều pod/instance, message gửi tới pod A cần được chuyển tới user đang kết nối ở pod B.
2. **Pub/Sub**: Backend dùng Valkey pub/sub để broadcast message giữa các instance.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client 1 │────►│ Pod A    │     │ Pod B    │◄───│ Client 2 │
└──────────┘     └────┬─────┘     └────┬─────┘   └──────────┘
                      │                │
                      └───► Valkey ◄───┘
                        (Pub/Sub)
```

> **Trong môi trường local**, chỉ có 1 instance backend nên Valkey chủ yếu dùng cho internal messaging. Nhưng khi deploy production với nhiều instance, Valkey đảm bảo message tới đúng user.

---

## Vai trò của PostgreSQL / DynamoDB

Database dùng để lưu:

- **Active connections**: Thông tin các kết nối đang hoạt động
- **User / Group**: Quản lý user và nhóm
- **Notifications**: Lịch sử thông báo
- **FCM Devices**: Token Firebase Cloud Messaging (cho push notification mobile)

> Trong Quick Start, backend tự tạo tables cần thiết nhờ `CREATE_TABLES: true` trong config.

---

## Tiếp theo

→ [06 - Tuỳ chỉnh cho dự án của bạn](./06-customization.md)
