# Feature Comparison: Pipewave vs Socket.IO

## 1. Transport Layer

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| WebSocket | Binary frames (msgpack) | Text frames (JSON) |
| Fallback | Long Polling (auto) | HTTP Long Polling (auto) |
| WebTransport | Chưa hỗ trợ | Hỗ trợ (v4.7+) |
| Protocol overhead | Rất thấp (msgpack binary) | Trung bình (`42["event","data"]`) |
| Upgrade mechanism | WS-first, fallback sau max retry | LP-first, upgrade lên WS |

### Phân tích:
- **Pipewave thắng** ở binary protocol — msgpack nhỏ hơn 20-50% so với JSON, parse nhanh hơn, CPU thấp hơn.
- **Socket.IO thắng** ở strategy: bắt đầu bằng Long Polling (luôn hoạt động) rồi upgrade lên WS, đảm bảo connection đầu tiên luôn thành công. Pipewave bắt đầu bằng WS rồi fallback, nghĩa là user có thể phải chờ nhiều retry trước khi có connection.
- **Socket.IO thắng** ở WebTransport support — giao thức tương lai thay thế WebSocket.

---

## 2. Messaging Model

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| Event model | Type-based (`MsgType` string) | Event-based (`emit`/`on`) |
| Serialization | MessagePack (binary) | JSON (default), custom parsers |
| Message ID | Built-in (`Id` field) | Không built-in |
| Acknowledgements | Qua response type | Built-in (`callback` trong emit) |
| Error handling | Dedicated `Error` field per frame | Qua callback hoặc event |
| Broadcast | `SendToUser(userID, ...)` | `io.to(room).emit(...)` |

### Phân tích:
- **Pipewave thắng** ở structured message format — mỗi frame có `Id`, `MsgType`, `Error`, `Binary` rõ ràng. Socket.IO chỉ là event name + arbitrary data.
- **Socket.IO thắng** ở flexibility — `emit`/`on` pattern quen thuộc, dễ học. Acknowledgement callback rất tiện. Pipewave yêu cầu response-type pattern phức tạp hơn.

---

## 3. Addressing & Routing

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| Addressing unit | **User ID** | **Socket ID** (connection) |
| Multi-device | Tự động (cùng userID) | Manual (join room = userID) |
| Rooms | Không có | Built-in (join/leave/broadcast) |
| Namespaces | Không có | Built-in (multiplexed channels) |
| Private messaging | SendToUser native | Qua rooms (pattern) |

### Phân tích:
- **Pipewave thắng rõ rệt** ở User-based addressing. Đây là use case phổ biến nhất (chat, notification, real-time update) và Pipewave giải quyết native. Với Socket.IO, bạn phải tự build pattern: map userID -> socketIDs, join room theo userID, v.v.
- **Socket.IO thắng** ở Rooms & Namespaces — 2 abstraction cực kỳ mạnh cho group messaging, channel isolation, multi-tenant. Pipewave hiện **hoàn toàn thiếu** tính năng này.

---

## 4. Scalability

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| Horizontal scaling | PubSub native (Valkey/Redis) | Adapter pattern (Redis adapter) |
| Sticky sessions | **Không cần** | **Cần** (hoặc adapter) |
| State storage | External (DynamoDB) | In-memory (default) |
| Memory per idle conn | Near-zero (kqueue/epoll) | ~goroutine/thread overhead |
| Kubernetes-ready | Native, zero config | Cần Redis adapter + config |

### Phân tích:
- **Pipewave thắng rõ rệt** ở scaling story. No sticky session, external state, PubSub built-in. Đây là pain point lớn nhất của Socket.IO — scaling Socket.IO trong K8s là nightmare phổ biến.
- **Pipewave thắng** ở memory efficiency — kqueue/epoll + zero-buffer idle là game changer cho high-connection scenarios.

---

## 5. Developer Experience

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| Backend language | **Go only** | Node.js, Java, Python, Go*, Rust* |
| Frontend framework | **React only** (hook) | Framework-agnostic + many clients |
| Learning curve | Thấp (2 functions) | Thấp (emit/on pattern) |
| TypeScript support | First-class | First-class |
| Debug tools | debugMode flag | Admin UI, debug logging |
| Documentation | Good (cho early stage) | Excellent (mature) |

### Phân tích:
- **Socket.IO thắng** ở ecosystem breadth — hỗ trợ hàng chục languages/platforms.
- **Pipewave thắng** ở simplicity — chỉ cần implement 2 functions (`InspectToken` + `HandleMessage`) là xong backend. Frontend chỉ cần 1 hook. Barrier to entry cực thấp.

---

## 6. Authentication & Security

| Feature | Pipewave | Socket.IO |
|---------|----------|-----------|
| Auth model | Token-based (InspectToken) | Middleware-based |
| Auth timing | Connection handshake | Connection hoặc per-event |
| Anonymous support | Built-in (isAnonymous flag) | Manual |
| Token refresh | getAccessToken on reconnect | Manual |

### Phân tích:
- **Pipewave thắng** ở opinionated auth — InspectToken pattern buộc developer phải handle auth đúng cách. getAccessToken refresh on reconnect là detail rất thoughtful.
- **Socket.IO** flexible hơn nhưng cũng dễ implement sai.

---

## 7. Tính năng Socket.IO có mà Pipewave chưa có

| Feature | Tầm quan trọng | Khó implement |
|---------|----------------|---------------|
| Rooms (group messaging) | **Rất cao** | Trung bình |
| Namespaces (channel isolation) | Cao | Trung bình |
| Acknowledgement callbacks | Cao | Thấp |
| WebTransport support | Trung bình | Cao |
| Volatile events (fire-and-forget) | Thấp | Thấp |
| Binary streaming (chunked) | Trung bình | Trung bình |
| Admin UI | Trung bình | Cao |
| Multi-language server SDK | **Rất cao** (cho adoption) | Rất cao |
| Multi-framework client SDK | **Rất cao** (cho adoption) | Cao |
