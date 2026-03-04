# Pipewave — Những điểm cần cải thiện để cạnh tranh

## Mức độ ưu tiên: CRITICAL (Phải có trước khi open source)

### 1. Rooms / Group Messaging

**Vấn đề:** Pipewave chỉ có `SendToUser`. Không có khái niệm "room" hay "group".

**Tại sao critical:**
- Chat rooms, game lobbies, collaborative editing, live events — tất cả cần group messaging
- Socket.IO rooms là feature được dùng nhiều nhất sau basic emit/on
- Không có rooms = mất ~40-50% use cases tiềm năng

**Đề xuất implementation:**
```go
// Backend API
ws.SendToRoom(ctx, "room_123", "CHAT_MESSAGE", data)
ws.JoinRoom(ctx, userID, "room_123")
ws.LeaveRoom(ctx, userID, "room_123")
ws.GetRoomMembers(ctx, "room_123") []string

// Frontend hook có thể subscribe theo room
const { status, send } = usePipewave({
    CHAT_MESSAGE: handleChat,
}, { rooms: ["room_123", "room_456"] })
```

**Effort estimate:** 2-3 tuần cho cả backend + frontend + PubSub integration

---

### 2. Acknowledgement / Request-Response Pattern

**Vấn đề:** Hiện tại Pipewave có request-response qua `HandleMessage` return type, nhưng không có explicit acknowledgement cho server-pushed messages.

**Tại sao critical:**
```tsx
// Socket.IO: Biết chắc server đã nhận
socket.emit('order', data, (response) => {
    console.log('Server confirmed:', response)
})

// Pipewave: Phải tự build correlation bằng message ID
send({ id: myId, msgType: 'ORDER', data })
// Rồi listen cho response type match myId... manual và error-prone
```

**Đề xuất:**
```tsx
// Proposed API
const response = await send({
    msgType: 'ORDER',
    data: orderData,
    timeout: 5000, // ms
})
// response tự động correlate bằng message ID
```

**Effort estimate:** 1-2 tuần

---

### 3. Comprehensive Test Suite & Benchmarks

**Vấn đề:** Open source project cần có:
- Unit tests với coverage > 80%
- Integration tests (WS + Long Polling)
- Benchmark suite có thể reproduce
- Comparison benchmarks vs Socket.IO

**Tại sao critical:**
- Performance claims cần proof
- Contributors cần tests để confident submit PR
- CI/CD pipeline cần test gates

**Effort estimate:** 2-3 tuần

---

## Mức độ ưu tiên: HIGH (Nên có trong 3-6 tháng đầu)

### 4. Multi-Framework Client SDK

**Vấn đề:** Chỉ support React. Không có Vue, Angular, Svelte, vanilla JS.

**Tại sao high priority:**
- React chiếm ~40% market share, nhưng bạn đang bỏ qua 60%
- Nhiều company dùng Vue (đặc biệt ở châu Á) hoặc Angular (enterprise)
- Vanilla JS client là minimum — cho phép bất kỳ framework nào dùng được

**Đề xuất roadmap:**
1. **Phase 1:** Tách core WebSocket logic ra khỏi React hook thành standalone `@pipewave/client`
2. **Phase 2:** React hook wrapper `@pipewave/react` (đã có)
3. **Phase 3:** Vue composable `@pipewave/vue`
4. **Phase 4:** Svelte store `@pipewave/svelte`

**Effort estimate:** 2-3 tuần cho vanilla client, 1 tuần mỗi framework wrapper

---

### 5. Namespaces / Channel Isolation

**Vấn đề:** Không có cách tách biệt logical channels trên cùng connection.

**Use cases cần namespaces:**
- Admin channel vs User channel (khác permission)
- Multi-tenant: mỗi tenant 1 namespace
- Feature isolation: chat namespace, notification namespace, metrics namespace

**Đề xuất:** Có thể implement đơn giản bằng prefix trên MsgType:
```
"admin/USER_LIST" vs "chat/NEW_MESSAGE"
```
Nhưng cần formal abstraction để handle middleware per namespace.

**Effort estimate:** 2-3 tuần

---

### 6. Nhiều PubSub & Storage Adapters

**Vấn đề:** Hiện chỉ support Valkey/Redis (PubSub) và DynamoDB (storage).

**Cần thêm:**
| Adapter | Type | Priority |
|---------|------|----------|
| NATS | PubSub | High (cloud-native) |
| RabbitMQ | PubSub | Medium |
| PostgreSQL | Storage | **High** (phổ biến nhất) |
| MongoDB | Storage | Medium |
| In-memory | Both | **High** (dev/testing) |
| SQLite | Storage | Low (embedded) |

**Tại sao high priority:**
- DynamoDB = AWS lock-in. Nhiều team không dùng AWS
- PostgreSQL adapter mở ra cho 80% thêm potential users
- In-memory adapter cho phép `go run main.go` không cần infrastructure

**Effort estimate:** 1-2 tuần mỗi adapter (interface đã có)

---

### 7. Observability & Metrics

**Vấn đề:** Không có metrics, tracing, hay structured logging.

**Cần có:**
```go
// Prometheus metrics
pipewave_connections_active{instance="pod-1"} 15234
pipewave_messages_sent_total{type="CHAT"} 892341
pipewave_message_latency_seconds{quantile="0.99"} 0.023
pipewave_long_polling_active 42

// OpenTelemetry tracing
// Trace: client send -> server receive -> HandleMessage -> response
```

**Effort estimate:** 2 tuần

---

## Mức độ ưu tiên: MEDIUM (6-12 tháng)

### 8. Admin Dashboard / Debug UI

Socket.IO có Admin UI cho phép:
- View active connections
- View rooms & namespaces
- Send test events
- Monitor real-time metrics

Pipewave cần tương tự, ít nhất ở mức basic.

**Effort estimate:** 4-6 tuần

---

### 9. WebTransport Support

WebTransport là giao thức tương lai (HTTP/3 based), hỗ trợ:
- Unreliable datagrams (cho gaming, streaming)
- Multiple streams per connection
- Better performance than WebSocket

Socket.IO đã hỗ trợ từ v4.7. Pipewave nên có roadmap.

**Effort estimate:** 4-8 tuần

---

### 10. Multi-Language Server SDK

Hiện chỉ có Go. Để mở rộng adoption:
- **Rust** (performance-focused community, align với Pipewave philosophy)
- **Python** (FastAPI ecosystem đang boom)
- **Java/Kotlin** (enterprise market)

**Lưu ý:** Đây là investment lớn. Có thể để community contribute sau khi protocol được document rõ.

**Effort estimate:** 2-3 tháng mỗi language

---

### 11. Connection-Level Events

**Vấn đề:** Thiếu lifecycle events phong phú.

**Cần thêm:**
```go
// Backend hooks
OnConnect(func(ctx, userID) error)
OnDisconnect(func(ctx, userID, reason))
OnError(func(ctx, userID, error))
OnRoomJoin(func(ctx, userID, roomID))
OnRoomLeave(func(ctx, userID, roomID))
```

```tsx
// Frontend events (đã có phần qua eventHandler, nhưng cần mở rộng)
onReconnect: (attempt: number) => void
onReconnectFailed: () => void
onTransportChange: (transport: 'websocket' | 'long-polling') => void
```

---

### 12. Rate Limiting & Backpressure

**Vấn đề:** Không có built-in rate limiting.

**Cần có:**
```yaml
websocket:
  rate_limit:
    messages_per_second: 100
    burst: 200
    per_user: true
```

Quan trọng cho production deployment, đặc biệt khi expose public API.

---

## Tóm tắt Priority Matrix

```
                    Impact
                    High ┤
                         │  [Rooms]  [Benchmarks]
                         │  [Ack/RR] [Multi-framework]
                         │  [PG adapter] [In-memory adapter]
                    Med  │  [Namespaces] [Metrics]
                         │  [Admin UI] [Lifecycle events]
                         │  [Rate limiting]
                    Low  │  [WebTransport] [Multi-lang server]
                         └──────────────────────────────────
                           Low        Med        High
                                   Effort
```
