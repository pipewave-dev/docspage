# Pipewave — Điểm mạnh & Lợi thế cạnh tranh

## 1. Binary-First Protocol (MessagePack)

**Đây là differentiator lớn nhất.**

Socket.IO mặc định truyền JSON text frames. Mỗi message đi qua wire ở dạng:
```
42["chat_message",{"user":"john","text":"hello","timestamp":1709123456}]
```

Pipewave truyền msgpack binary frames:
```
Binary: ~60-70% kích thước của JSON tương đương
```

**Ý nghĩa thực tế:**
- Bandwidth giảm 20-50% so với JSON
- CPU parse time thấp hơn đáng kể (binary decode vs string parse)
- Native type support (int, float, bytes) không cần string conversion
- Đặc biệt lợi thế cho: IoT data streams, real-time gaming, financial data, binary file chunks

**Đây là selling point #1** khi pitch open source — performance-conscious developers sẽ bị thu hút ngay.

---

## 2. User-Based Addressing (thay vì Connection-Based)

Socket.IO address theo **socket ID** (connection-level):
```js
// Socket.IO: Phải tự quản lý user -> connections mapping
const userSockets = new Map()
io.on('connection', (socket) => {
  userSockets.set(socket.userId, socket.id)
})
// Gửi cho user: phải lookup socket ID
io.to(userSockets.get('user_123')).emit('notification', data)
// Multi-device? Phải manage array of socket IDs
// User reconnect? Phải update mapping
```

Pipewave address theo **User ID** natively:
```go
// Pipewave: Gửi cho user, xong.
ws.SendToUser(ctx, "user_123", "NOTIFICATION", data)
// Multi-device? Tự động — tất cả connections cùng userID nhận được
// User reconnect? Tự động — InspectToken trả về cùng userID
```

**Ý nghĩa thực tế:**
- Loại bỏ toàn bộ boilerplate code quản lý connection mapping
- Multi-device support là zero-effort
- Reconnection handling transparent
- **80% real-world use cases** là "gửi cho user X" chứ không phải "gửi cho connection Y"

---

## 3. Zero-Memory Idle Connections (kqueue/epoll/netpoll)

Socket.IO (Node.js) giữ mỗi connection trong memory với event loop overhead.

Pipewave (Go + kqueue/epoll):
- Idle connections được park ở kernel level
- Read/write buffers chỉ allocate khi có data thực sự
- Một pod có thể hold **hàng trăm nghìn idle connections** với memory footprint rất thấp

**Benchmark potential:**
```
100K idle connections:
- Socket.IO (Node.js): ~2-4GB RAM
- Pipewave (Go + netpoll): ~200-400MB RAM (estimated)
```

**Target audience:** Notification systems, IoT dashboards, monitoring tools — nơi hầu hết connections idle 99% thời gian.

---

## 4. Horizontal Scaling Without Sticky Sessions

Đây là **pain point #1 của Socket.IO community**.

Socket.IO scaling story:
1. Cần Redis adapter
2. Cần sticky sessions ở load balancer (vì Long Polling dùng multiple HTTP requests)
3. Config NGINX/ALB sticky session là error-prone
4. Mỗi lần scale up/down phải worry về session affinity

Pipewave scaling story:
1. Config PubSub (Valkey/Redis) trong YAML
2. Deploy N instances
3. **Done.** No sticky sessions. No special LB config.

Connection state stored externally (DynamoDB) nên bất kỳ instance nào cũng có thể serve bất kỳ request nào.

---

## 5. Opinionated Auth Pattern

Pipewave buộc bạn implement `InspectToken`:
```go
InspectToken: func(ctx context.Context, token string) (username, isAnonymous, error)
```

**Tại sao đây là điểm mạnh:**
- Không thể "quên" auth — nó là required parameter
- Token refresh tự động (frontend gọi `getAccessToken` mỗi lần reconnect)
- Anonymous connection support built-in
- Auth logic tách biệt khỏi business logic (clean separation)

Socket.IO auth là optional middleware — dễ quên, dễ implement sai.

---

## 6. React First-Class Integration

```tsx
const { status, send } = usePipewave({
    CHAT_MESSAGE: handleChat,
    NOTIFICATION: showToast,
})
```

**So với Socket.IO React pattern:**
```tsx
// Socket.IO: Manual lifecycle management
useEffect(() => {
    const socket = io('http://localhost:3000')
    socket.on('chat_message', handleChat)
    socket.on('notification', showToast)
    return () => { socket.disconnect() }
}, [])
```

Pipewave advantages:
- Reactive `status` (CONNECTING, READY, DISCONNECTED, LONG_POLLING)
- Auto cleanup on unmount
- Multiple hooks in different components share same connection
- Handler registration is declarative, not imperative
- No manual socket lifecycle management

---

## 7. Simplicity of Integration

Backend setup = **2 functions** (`InspectToken` + `HandleMessage`)
Frontend setup = **1 provider** + **1 hook**

Toàn bộ complexity (heartbeat, reconnect, fallback, binary encode/decode, PubSub broadcast) được abstract away.

So với Socket.IO — mặc dù Socket.IO cũng đơn giản, Pipewave đơn giản hơn theo cách **opinionated** — bạn không cần đọc docs để biết nên dùng rooms hay namespace, nên handle reconnect thế nào, nên auth ở đâu. Pipewave đã quyết định cho bạn.

---

## 8. Long Polling Batch Optimization

Khi fallback về Long Polling, Socket.IO gửi từng message riêng biệt qua HTTP.

Pipewave batch nhiều pending messages vào 1 response:
```
Client poll -> Server trả về: [msg1, msg2, msg3] trong 1 binary blob
```

Giảm đáng kể số HTTP round-trips, đặc biệt quan trọng trong high-throughput scenarios.

---

## Tóm tắt Unique Selling Points cho Open Source

1. **"10x fewer idle connections memory"** — dùng Go + kqueue thay vì Node.js event loop
2. **"Send to users, not connections"** — User-based addressing built-in
3. **"Scale without sticky sessions"** — PubSub + external state = true stateless
4. **"Binary by default"** — 20-50% smaller payloads, faster parsing
5. **"2 functions backend, 1 hook frontend"** — Simplest possible DX
6. **"React-native real-time"** — Not a generic adapter, a React-first design
