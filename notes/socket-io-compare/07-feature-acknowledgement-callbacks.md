# Deep Dive: Socket.IO Acknowledgement Callbacks — So sánh với Pipewave

## Mục lục
1. [Acknowledgement là gì và tại sao quan trọng](#1-what)
2. [Socket.IO Acknowledgement — cơ chế đầy đủ](#2-socketio-ack)
3. [Wire Protocol — ack hoạt động thế nào ở tầng packet](#3-wire-protocol)
4. [Pipewave hiện tại — request-response ngầm qua HandleMessage](#4-pipewave-current)
5. [Gap Analysis — Pipewave thiếu gì so với Socket.IO ack](#5-gap)
6. [Các pattern thực tế bị ảnh hưởng](#6-real-world)
7. [Đề xuất thiết kế Acknowledgement cho Pipewave](#7-proposal)

---

## 1. Acknowledgement là gì và tại sao quan trọng {#1-what}

Acknowledgement (ack) là cơ chế **xác nhận đã nhận và xử lý** một message. Nó biến giao tiếp từ "fire-and-forget" thành "request-response" — sender biết chắc receiver đã nhận, đã xử lý, và có thể nhận kết quả trả về.

### Không có Acknowledgement:
```
Client ──emit("order", data)──→ Server
         ↑
         └── Client KHÔNG BIẾT:
             - Server đã nhận chưa?
             - Xử lý thành công hay lỗi?
             - Kết quả trả về là gì?
```

### Có Acknowledgement:
```
Client ──emit("order", data, callback)──→ Server
Client ←───callback({ status: "ok" })───← Server
         ↑
         └── Client BIẾT CHẮC:
             - Server đã nhận ✓
             - Xử lý xong ✓
             - Kết quả: { status: "ok" } ✓
```

### Tại sao critical cho production:
- **Form submissions**: user cần biết đã submit thành công
- **Payment processing**: PHẢI biết server đã nhận order
- **Chat delivery**: "đã gửi" indicator cần ack
- **File uploads**: progress + completion confirmation
- **Optimistic UI**: rollback nếu ack fail hoặc timeout
- **Idempotency**: retry logic cần biết request trước đã thành công chưa

---

## 2. Socket.IO Acknowledgement — cơ chế đầy đủ {#2-socketio-ack}

### 2.1 Client → Server Acknowledgement

```javascript
// CLIENT: gửi event với callback cuối cùng
socket.emit("create:order", orderData, (response) => {
    // Callback này chạy khi SERVER gọi callback phía nó
    console.log(response) // { orderId: "ORD-123", status: "created" }
})

// SERVER: nhận event, tham số cuối là callback function
io.on("connection", (socket) => {
    socket.on("create:order", async (data, callback) => {
        try {
            const order = await db.createOrder(data)
            callback({ orderId: order.id, status: "created" }) // ← Trigger client callback
        } catch (err) {
            callback({ error: err.message })
        }
    })
})
```

**Đặc điểm:**
- Callback là tham số cuối cùng trong `emit()`
- Server nhận callback như function parameter
- Gọi callback = gửi ack packet về client
- Chỉ gọi được **1 lần** (idempotent)
- Có thể truyền bất kỳ serializable data nào

### 2.2 Server → Client Acknowledgement

Hoạt động y hệt nhưng ngược chiều:

```javascript
// SERVER: emit với callback
socket.emit("request:location", (response) => {
    console.log(response) // { lat: 10.8, lng: 106.6 }
})

// CLIENT: nhận event, gọi callback để ack
socket.on("request:location", (callback) => {
    navigator.geolocation.getCurrentPosition((pos) => {
        callback({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
})
```

**Use case:** Server yêu cầu client cung cấp data (location, device info, user consent).

### 2.3 Timeout Handling (v4.4.0+)

```javascript
// Timeout 5 giây — nếu không nhận ack thì err !== null
socket.timeout(5000).emit("create:order", orderData, (err, response) => {
    if (err) {
        // Server không respond trong 5s
        // err là Error object
        showError("Server không phản hồi, vui lòng thử lại")
        return
    }
    showSuccess(`Order ${response.orderId} created!`)
})
```

**Đặc điểm:**
- `err` là tham số đầu tiên (Node.js convention)
- Nếu timeout: `err` = Error object, `response` = undefined
- Nếu thành công: `err` = null, `response` = data từ server
- Timeout chỉ ở phía sender, server không biết client đã timeout

### 2.4 Broadcast Acknowledgement (v4.5.0+)

```javascript
// Gửi cho tất cả trong room, nhận ack từ MỌI client
io.to("room:vip").timeout(5000).emit("urgent:alert", alertData, (err, responses) => {
    if (err) {
        // Một số clients KHÔNG ack trong 5s
        console.log("Some clients did not respond")
    }
    // responses = array, mỗi phần tử là ack từ 1 client
    console.log(`${responses.length} clients confirmed`)
})
```

**Đặc điểm:**
- `responses` là array (1 entry per client đã ack)
- `err` set nếu BẤT KỲ client nào không ack trong timeout
- Kết hợp với rooms để chỉ ack từ subset clients

### 2.5 Volatile Events (Ngược lại với Ack)

```javascript
// Fire-and-forget — KHÔNG buffer nếu disconnected
socket.volatile.emit("cursor:position", { x: 100, y: 200 })
```

**Đặc điểm:**
- Nếu client đang disconnected → message bị DROP, không retry
- Phù hợp cho: mouse position, typing indicator, game state (nơi data cũ = vô giá trị)
- Ngược hoàn toàn với ack pattern — chấp nhận mất data

---

## 3. Wire Protocol — Ack hoạt động thế nào ở tầng packet {#3-wire-protocol}

### Packet Types liên quan

```
Type 2: EVENT         — event thông thường
Type 3: ACK           — acknowledgement (text response)
Type 5: BINARY_EVENT  — event chứa binary data
Type 6: BINARY_ACK    — acknowledgement chứa binary data
```

### Lifecycle trên wire

```
Bước 1: Client gửi EVENT với ack ID
────────────────────────────────────
Packet:  2/chat,15["create:order",{"item":"book","qty":2}]
         │ │     │  │              │
         │ │     │  │              └── data payload
         │ │     │  └── event name
         │ │     └── ack ID = 15 (auto-increment integer)
         │ └── namespace /chat
         └── type 2 = EVENT


Bước 2: Server xử lý, gửi ACK với cùng ID
────────────────────────────────────────────
Packet:  3/chat,15[{"orderId":"ORD-123","status":"created"}]
         │ │     │  │
         │ │     │  └── response payload (array)
         │ │     └── ack ID = 15 (PHẢI khớp với request)
         │ └── namespace /chat
         └── type 3 = ACK


Bước 3: Client match ack ID 15 → trigger callback
```

### ID Correlation Mechanism

```
Client internal state:
┌──────────────────────────────────────────┐
│ Pending Acks Map                          │
│                                           │
│   ID: 13 → callback(response) [timer: 5s]│
│   ID: 14 → callback(response) [timer: 5s]│
│   ID: 15 → callback(response) [timer: 5s]│  ← Waiting
│   ID: 16 → callback(response) [no timer] │
│                                           │
│ Nhận ACK packet với id=15:                │
│   1. Lookup pending[15]                   │
│   2. Clear timeout timer                  │
│   3. Invoke callback(payload)             │
│   4. Delete pending[15]                   │
└──────────────────────────────────────────┘
```

**Key insights:**
- Ack ID là **auto-increment integer** (nhẹ hơn UUID)
- Mỗi connection có counter riêng (không cần global unique)
- Client và Server đều maintain pending ack map
- Timeout timer tự động cleanup stale entries

### Binary Acknowledgement

Khi ack chứa binary data (Buffer, ArrayBuffer):
```
Packet:  61-/chat,15[{"data":{"_placeholder":true,"num":0}}]
         ││  │     │                                        │
         ││  │     │  └── placeholder cho binary attachment  │
         ││  │     └── ack ID                               │
         ││  └── namespace                                  │
         │└── 1 binary attachment                           │
         └── type 6 = BINARY_ACK                            │
                                                             │
+ <binary buffer>  ← gửi kèm sau packet chính               │
```

---

## 4. Pipewave hiện tại — request-response ngầm qua HandleMessage {#4-pipewave-current}

### Cơ chế hiện có

Pipewave có **implicit request-response** qua `HandleMessage`:

```go
// Server: HandleMessage TỰ ĐỘNG trả response về client
HandleMessage: func(ctx, auth, inputType, data) (outputType, res, err) {
    // Xử lý...
    return "ORDER_CREATED", responseBytes, nil
    // ↑ Response tự động gửi về client đã gửi request
}
```

```tsx
// Client: Nhận response qua message handler
const { send } = usePipewave({
    ORDER_CREATED: async (data) => {
        // Đây là "response" cho request trước đó
        showSuccess(decode(data))
    },
})

// Gửi request
send({ id: crypto.randomUUID(), msgType: "CREATE_ORDER", data: orderBytes })
```

### Cách nó hoạt động trên wire

```
Client frame:  { i: "uuid-abc", t: "CREATE_ORDER", b: <order data> }
                  │
                  ▼
Server HandleMessage processes...
                  │
                  ▼
Server frame:  { i: "uuid-abc", t: "ORDER_CREATED", b: <response>, e: null }
               ↑
               └── Cùng message ID "uuid-abc"
```

### Điều Pipewave đã có

| Feature | Status |
|---------|--------|
| Request → Response correlation (qua message ID) | **Có** (manual) |
| Error response (qua `e` field) | **Có** |
| Binary response | **Có** (msgpack native) |
| Auto-increment ID (lightweight) | **Không** (dùng UUID) |
| Timeout handling | **Không** |
| Promise/callback API ở frontend | **Không** |
| Server → Client ack | **Không** |
| Broadcast ack | **Không** |
| Volatile/fire-and-forget flag | **Không** |

---

## 5. Gap Analysis — Pipewave thiếu gì {#5-gap}

### Gap 1: Không có Promise/Callback API — Developer phải tự correlate

**Socket.IO:**
```javascript
// 1 dòng code: gửi + nhận response
const response = await socket.timeout(5000).emitWithAck("create:order", data)
// Hoặc callback style
socket.emit("create:order", data, (response) => { /* ... */ })
```

**Pipewave hiện tại:**
```tsx
// Phải viết ~15 dòng boilerplate cho MỖI request-response
const [orderResult, setOrderResult] = useState(null)
const pendingRef = useRef<Map<string, (data: Uint8Array) => void>>(new Map())

const handlers = useMemo(() => ({
    ORDER_CREATED: async (data: Uint8Array, messageId: string) => {
        const resolver = pendingRef.current.get(messageId)
        if (resolver) {
            resolver(data)
            pendingRef.current.delete(messageId)
        }
    },
}), [])

const { send } = usePipewave(handlers)

const createOrder = () => {
    const id = crypto.randomUUID()
    return new Promise((resolve, reject) => {
        pendingRef.current.set(id, resolve)
        send({ id, msgType: "CREATE_ORDER", data: orderBytes })
        // Không có timeout! Nếu server không respond → memory leak
        setTimeout(() => {
            if (pendingRef.current.has(id)) {
                pendingRef.current.delete(id)
                reject(new Error("Timeout"))
            }
        }, 5000)
    })
}
```

**Impact:** Mọi developer dùng Pipewave đều phải viết pattern này. Đây là boilerplate lặp lại, error-prone, và khó test.

### Gap 2: Không có Timeout → Memory leak risk

```
Scenario:
1. Client gửi message { id: "abc", t: "CREATE_ORDER" }
2. Server crash / network drop / bug trong HandleMessage
3. Client đợi response cho id "abc" MÃI MÃI
4. Nếu developer tự build pending map → entry "abc" không bao giờ được cleanup
5. Repeat 1000 lần → memory leak
```

Socket.IO giải quyết bằng `.timeout(ms)` — tự động fire error callback + cleanup.

### Gap 3: Không có Server → Client Acknowledgement

```
Scenario: Server push notification, cần biết client đã render chưa
```

**Socket.IO:**
```javascript
// Server
socket.timeout(3000).emit("notification", data, (err, response) => {
    if (err) {
        // Client không confirm → save to retry queue
        saveForRetry(userId, data)
    } else {
        markAsDelivered(notificationId)
    }
})

// Client
socket.on("notification", (data, callback) => {
    renderNotification(data)
    callback({ received: true }) // ← Confirm
})
```

**Pipewave:** Không có cách nào để server biết client đã nhận `SendToUser`. Đây là fire-and-forget hoàn toàn.

### Gap 4: Không có Broadcast Acknowledgement

```
Scenario: Gửi alert cho tất cả admin, cần biết bao nhiêu người đã thấy
```

**Socket.IO:**
```javascript
io.to("admins").timeout(10000).emit("critical:alert", data, (err, responses) => {
    console.log(`${responses.length} admins confirmed seeing the alert`)
})
```

**Pipewave:** Không có tương đương. `SendToUser` không có feedback loop.

### Gap 5: Không có Volatile Events

```
Scenario: Gửi mouse position 60fps, không cần buffer khi disconnect
```

**Socket.IO:**
```javascript
socket.volatile.emit("cursor", { x, y }) // Drop nếu disconnected
```

**Pipewave:** Mọi message đều buffered (trong Long Polling queue). Không có cách đánh dấu "message này có thể drop".

---

## 6. Các pattern thực tế bị ảnh hưởng {#6-real-world}

### 6.1 Optimistic UI với Rollback

```tsx
// Ideal pattern (cần ack):
const sendMessage = async (text) => {
    // 1. Optimistic: hiển thị message ngay
    addMessage({ text, status: "sending" })

    try {
        // 2. Gửi + đợi ack
        const result = await send("CHAT_SEND", data, { timeout: 5000 })
        // 3. Confirm: cập nhật status
        updateMessage(result.id, { status: "sent" })
    } catch (err) {
        // 4. Rollback: xóa hoặc đánh dấu failed
        updateMessage(tempId, { status: "failed" })
    }
}
```

Với Pipewave hiện tại, pattern này phải build manually cho mỗi feature.

### 6.2 Sequential Operations (ordering guarantee)

```tsx
// Cần chắc chắn step 1 xong mới làm step 2
const result1 = await send("STEP_1", data1, { timeout: 3000 })
const result2 = await send("STEP_2", { ...data2, ref: result1.id }, { timeout: 3000 })
const result3 = await send("STEP_3", { ...data3, ref: result2.id }, { timeout: 3000 })
```

Không có ack → phải dùng complex state machine với multiple handlers.

### 6.3 Delivery Confirmation (read receipts)

```
Server push message → Client render → Client ack "đã đọc"
                                        ↑
                                        └── Cần Server→Client ack
```

### 6.4 Health Check / Capability Negotiation

```javascript
// Server kiểm tra client capabilities
socket.timeout(2000).emit("capability:check", (err, caps) => {
    if (caps.supportsWebRTC) enableVideoCall()
    if (caps.supportsNotifications) enablePush()
})
```

---

## 7. Đề xuất thiết kế Acknowledgement cho Pipewave {#7-proposal}

### Nguyên tắc thiết kế

1. **Giữ binary protocol** — ack phải là msgpack frame, không phải JSON
2. **Giữ đơn giản** — không over-engineer, cover 90% use cases
3. **Backward compatible** — apps hiện tại không bị break
4. **Opt-in** — ack là optional, default vẫn fire-and-forget

### Proposed Wire Protocol Changes

Thêm 1 field vào frame schema:

```go
type WebsocketResponse struct {
    Id      string      `msgpack:"i"` // Message ID (đã có)
    MsgType MessageType `msgpack:"t"` // Message Type (đã có)
    Error   []byte      `msgpack:"e"` // Error (đã có)
    Binary  []byte      `msgpack:"b"` // Payload (đã có)
    AckFor  string      `msgpack:"a"` // NEW: Ack cho message ID nào (empty = không phải ack)
}
```

Hoặc tối ưu hơn — dùng 1 bit flag trong MsgType:

```go
// Convention: MsgType bắt đầu bằng "_ack:" là acknowledgement frame
// Không cần thêm field mới → backward compatible 100%
MsgType: "_ack:ORDER_CREATED"  // Ack frame
MsgType: "ORDER_CREATED"       // Normal frame
```

### Proposed Backend API

```go
// Option A: HandleMessage giữ nguyên (đã là request-response pattern)
// Chỉ thêm API cho server-push-with-ack:

// Fire-and-forget (giữ nguyên)
ws.SendToUser(ctx, userID, "NOTIFICATION", data)

// Với ack (mới)
ack, err := ws.SendToUserWithAck(ctx, userID, "NOTIFICATION", data, 5*time.Second)
if err != nil {
    // Timeout hoặc client error
    log.Printf("User %s did not acknowledge: %v", userID, err)
}
// ack.Data = response bytes từ client
```

```go
// Option B: Ack callback cho broadcast
results := ws.SendToRoomWithAck(ctx, "room:vip", "ALERT", data, 10*time.Second)
for _, r := range results {
    if r.Error != nil {
        log.Printf("User %s: no ack", r.UserID)
    } else {
        log.Printf("User %s: confirmed", r.UserID)
    }
}
```

### Proposed Frontend API

```tsx
// Option A: Promise-based (recommended)
const { send, sendWithAck, status } = usePipewave({
    NOTIFICATION: async (data, ack) => {
        renderNotification(decode(data))
        ack({ received: true }) // ← Gửi ack về server
    },
})

// Client-initiated request-response:
try {
    const response = await sendWithAck({
        msgType: "CREATE_ORDER",
        data: orderBytes,
        timeout: 5000,
    })
    // response.data = Uint8Array từ server HandleMessage
    showSuccess(decode(response.data))
} catch (err) {
    if (err.name === "TimeoutError") {
        showRetry("Server không phản hồi")
    } else {
        showError(err.message)
    }
}
```

```tsx
// Option B: Callback-based (cho compatibility)
send({
    msgType: "CREATE_ORDER",
    data: orderBytes,
    timeout: 5000,
    onAck: (response) => showSuccess(decode(response)),
    onTimeout: () => showRetry("Server không phản hồi"),
    onError: (err) => showError(err.message),
})
```

### Proposed: Volatile Events

```tsx
// Frontend
send({
    msgType: "CURSOR_MOVE",
    data: positionBytes,
    volatile: true, // Drop nếu disconnected, không buffer
})
```

```go
// Backend
ws.SendToUserVolatile(ctx, userID, "CURSOR_MOVE", data)
// Không queue trong Long Polling buffer, chỉ gửi nếu WS connected
```

### Implementation Priority

```
Phase 1 (Pre-launch, 1-2 tuần):
├── sendWithAck() frontend API (Promise-based)
├── Timeout handling + cleanup
└── Tận dụng message ID correlation đã có

Phase 2 (v1.1, 1 tuần):
├── Server → Client ack (ack callback trong handlers)
└── SendToUserWithAck() backend API

Phase 3 (v1.2, 1 tuần):
├── Volatile events (skip LP buffer)
└── Broadcast ack (SendToRoomWithAck)
```

### Nội bộ: Cách `sendWithAck` hoạt động

```
Frontend:
┌────────────────────────────────────────────────────────────┐
│ sendWithAck({ msgType: "CREATE_ORDER", timeout: 5000 })    │
│                                                             │
│ 1. Generate ID (UUID hoặc auto-increment)                  │
│ 2. Create Promise + store resolver in pendingAcks Map       │
│ 3. Set timeout timer (5000ms)                               │
│ 4. Send frame: { i: "abc", t: "CREATE_ORDER", b: <data> }  │
│                                                             │
│ ... đợi ...                                                 │
│                                                             │
│ Nhận frame: { i: "abc", t: "ORDER_CREATED", b: <resp> }    │
│ 5. Lookup pendingAcks["abc"]                                │
│ 6. Clear timeout timer                                      │
│ 7. Resolve Promise với response data                        │
│ 8. Delete pendingAcks["abc"]                                │
│                                                             │
│ HOẶC timeout:                                               │
│ 5b. Timer fires                                             │
│ 6b. Reject Promise với TimeoutError                         │
│ 7b. Delete pendingAcks["abc"]                               │
└────────────────────────────────────────────────────────────┘
```

**Key insight:** Pipewave đã có message ID (`i` field) và HandleMessage đã trả response với cùng ID. Vì vậy **phần backend gần như không cần thay đổi** — chỉ cần build `sendWithAck` wrapper ở frontend để correlate tự động.

---

## Tổng kết

| Aspect | Socket.IO | Pipewave hiện tại | Pipewave đề xuất |
|--------|-----------|-------------------|------------------|
| Client→Server ack | `emit(event, data, cb)` | Manual (qua message ID) | `sendWithAck()` Promise |
| Server→Client ack | `emit(event, data, cb)` | Không có | `ack()` trong handler |
| Timeout | `.timeout(ms)` | Không có | `{ timeout: ms }` option |
| Broadcast ack | `io.to().timeout().emit(cb)` | Không có | `SendToRoomWithAck()` |
| Volatile | `socket.volatile.emit()` | Không có | `{ volatile: true }` flag |
| Wire cost | +2 bytes (ack ID integer) | +0 (đã có UUID) | +0 (tận dụng existing ID) |

**Effort tổng:** ~3-4 tuần cho full implementation, nhưng Phase 1 (sendWithAck frontend) chỉ cần **3-5 ngày** vì Pipewave đã có sẵn message ID correlation — chỉ cần wrap thành Promise API.

**Recommendation:** Phase 1 nên ship cùng bản open source đầu tiên. `sendWithAck()` với timeout là **minimum viable ack** — cover 80% use cases mà developer cần. Server→Client ack và broadcast ack có thể thêm sau.
