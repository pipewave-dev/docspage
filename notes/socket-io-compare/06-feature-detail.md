# Deep Dive: Socket.IO Namespaces & Rooms — Bài học cho Pipewave

## Mục lục
1. [Namespaces là gì và giải quyết vấn đề gì](#1-namespaces)
2. [Cơ chế hoạt động nội bộ](#2-internals)
3. [Rooms & Adapter — Hệ thống con bên trong Namespaces](#3-rooms-adapter)
4. [Middleware per Namespace — Kiến trúc bảo mật theo tầng](#4-middleware)
5. [Dynamic Namespaces — Multi-tenancy pattern](#5-dynamic-namespaces)
6. [Tại sao Namespaces quan trọng cho Pipewave](#6-why-it-matters)
7. [Đề xuất thiết kế Namespaces/Channels cho Pipewave](#7-proposal)

---

## 1. Namespaces là gì và giải quyết vấn đề gì {#1-namespaces}

Namespace trong Socket.IO là một **kênh giao tiếp logic** chạy trên cùng một WebSocket connection vật lý. Nó cho phép multiplex nhiều "ứng dụng con" trên 1 connection duy nhất.

### Vấn đề mà Namespaces giải quyết

**Không có Namespaces:**
```
Client ←→ Server
  ├── chat events
  ├── notification events
  ├── admin events        ← Tất cả chung 1 pipe, không isolation
  ├── analytics events
  └── order events
```

Vấn đề:
- Tất cả events trộn lẫn, không có boundary
- Không thể áp dụng auth khác nhau (admin vs user)
- Không thể có middleware riêng per feature
- Room "lobby" của chat trùng tên với room "lobby" của game

**Có Namespaces:**
```
Client ←→ Server (1 WebSocket connection)
  ├── /chat          ← namespace riêng, rooms riêng, auth riêng
  ├── /notifications ← namespace riêng
  ├── /admin         ← cần admin role mới connect được
  └── /analytics     ← namespace riêng, middleware riêng
```

### Ví dụ thực tế trong Socket.IO

```javascript
// Server
const chatNsp = io.of("/chat")
chatNsp.use(requireAuth)           // auth middleware
chatNsp.on("connection", (socket) => {
    socket.join("room:general")
    socket.on("message", (data) => {
        chatNsp.to("room:general").emit("message", data)
    })
})

const adminNsp = io.of("/admin")
adminNsp.use(requireAdminRole)     // stricter auth
adminNsp.on("connection", (socket) => {
    socket.on("ban-user", (userId) => { /* ... */ })
    socket.on("delete-room", (roomId) => { /* ... */ })
})

// Client
const chatSocket = io("/chat")           // ┐
const adminSocket = io("/admin")         // ┘ Cùng 1 WS connection!

chatSocket.on("message", renderMessage)
adminSocket.emit("ban-user", "user_456")
```

Đặc điểm mấu chốt: **Tất cả namespaces chia sẻ 1 WebSocket connection vật lý**, chỉ khác nhau ở logical routing. Tiết kiệm tài nguyên network rất lớn.

---

## 2. Cơ chế hoạt động nội bộ {#2-internals}

### Packet Format

Mỗi Socket.IO packet trên wire có dạng:
```
<packet-type>[<namespace>,][<data>]
```

Ví dụ:
```
42/chat,["message",{"text":"hello"}]
│ │      │
│ │      └── event data (JSON)
│ └── namespace prefix
└── packet type (4=MESSAGE, 2=EVENT)
```

Khi namespace là `/` (default), prefix bị bỏ qua để tiết kiệm bandwidth:
```
42["message",{"text":"hello"}]
```

### Connection Lifecycle per Namespace

```
1. Client gửi CONNECT packet cho mỗi namespace
   → 40/chat,                    (connect to /chat)
   → 40/admin,{"token":"xyz"}    (connect to /admin với auth)

2. Server chạy middleware chain cho namespace đó
   → Nếu pass: gửi lại CONNECT ACK
   → Nếu fail: gửi CONNECT_ERROR, namespace connection bị reject

3. Mỗi namespace có socket instance riêng
   → socket.id khác nhau per namespace
   → rooms tách biệt per namespace
   → events tách biệt per namespace

4. Disconnect 1 namespace không ảnh hưởng namespace khác
   → Client có thể disconnect khỏi /admin nhưng vẫn connected /chat
```

### Multiplexing Diagram

```
┌──────────────────────────────────────────────────┐
│              1 WebSocket Connection               │
│                                                    │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Namespace /  │ │Namespace     │ │Namespace   │ │
│  │ (default)    │ │/chat         │ │/admin      │ │
│  │              │ │              │ │            │ │
│  │ ┌─────────┐ │ │ ┌──────────┐ │ │ ┌────────┐ │ │
│  │ │ Room A  │ │ │ │ Room A   │ │ │ │ Room A │ │ │
│  │ └─────────┘ │ │ └──────────┘ │ │ └────────┘ │ │
│  │ ┌─────────┐ │ │ ┌──────────┐ │ │            │ │
│  │ │ Room B  │ │ │ │ Room B   │ │ │            │ │
│  │ └─────────┘ │ │ └──────────┘ │ │            │ │
│  │             │ │              │ │            │ │
│  │ Middleware: │ │ Middleware:  │ │ Middleware: │ │
│  │  - logging  │ │  - auth      │ │  - auth    │ │
│  │             │ │  - rateLimit │ │  - isAdmin │ │
│  └─────────────┘ └──────────────┘ └────────────┘ │
│                                                    │
│  ← Tất cả share 1 TCP connection →                │
└──────────────────────────────────────────────────┘
```

**Room "A" trong /chat hoàn toàn tách biệt với Room "A" trong /admin.** Đây là isolation level mà Pipewave hiện chưa có.

---

## 3. Rooms & Adapter — Hệ thống con bên trong Namespaces {#3-rooms-adapter}

### Cấu trúc dữ liệu nội bộ

Mỗi Namespace sở hữu 1 **Adapter** instance. Adapter quản lý 2 Map:

```javascript
// Map<SocketId, Set<Room>> — socket thuộc những rooms nào
sids: {
    "socket_abc": Set(["socket_abc", "room:general", "room:vip"]),
    "socket_def": Set(["socket_def", "room:general"]),
}

// Map<Room, Set<SocketId>> — room chứa những sockets nào
rooms: {
    "room:general": Set(["socket_abc", "socket_def"]),
    "room:vip":     Set(["socket_abc"]),
    "socket_abc":   Set(["socket_abc"]),  // mỗi socket tự join room = ID của nó
    "socket_def":   Set(["socket_def"]),
}
```

### Broadcasting Mechanics

```javascript
// Gửi cho tất cả trong room
io.to("room:general").emit("hello")
// → Loop qua rooms["room:general"], gửi cho từng socket

// Gửi cho nhiều rooms (UNION, không duplicate)
io.to("room:general").to("room:vip").emit("hello")
// → Union của 2 Set, mỗi socket chỉ nhận 1 lần

// Gửi cho room nhưng exclude 1 room khác
io.to("room:general").except("room:muted").emit("hello")
// → Difference: rooms["room:general"] - rooms["room:muted"]

// Gửi từ 1 socket (exclude sender)
socket.to("room:general").emit("hello")
// → Gửi cho room nhưng bỏ qua socket hiện tại
```

### Room Lifecycle Events

```javascript
adapter.on("create-room", (room) => { /* room mới được tạo */ })
adapter.on("delete-room", (room) => { /* room trống, bị xóa */ })
adapter.on("join-room", (room, socketId) => { /* socket join room */ })
adapter.on("leave-room", (room, socketId) => { /* socket leave room */ })
```

### Adapter Pattern cho Scaling

Đây là kiến trúc mà Socket.IO dùng để scale rooms across servers:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Server 1   │    │  Server 2   │    │  Server 3   │
│  Adapter ◄──┼────┼──► Adapter ◄┼────┼──► Adapter  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                 ┌────────┴────────┐
                 │  Redis/Postgres │
                 │  (Pub/Sub)      │
                 └─────────────────┘
```

**8 official adapters:**
| Adapter | Backend | Use Case |
|---------|---------|----------|
| Redis | Redis Pub/Sub | Phổ biến nhất |
| Redis Streams | Redis Streams | Event sourcing |
| MongoDB | MongoDB Change Streams | MongoDB ecosystem |
| Postgres | LISTEN/NOTIFY | SQL ecosystem |
| Cluster | Node.js Cluster | Single machine scaling |
| GCP Pub/Sub | Google Cloud | GCP native |
| AWS SQS | Amazon SQS | AWS native |
| Azure Service Bus | Azure | Azure native |

**Key insight:** Socket.IO vẫn **cần sticky sessions** cho HTTP Long Polling ngay cả khi dùng adapter. Pipewave không cần — đây là lợi thế kiến trúc rõ ràng.

---

## 4. Middleware per Namespace — Kiến trúc bảo mật theo tầng {#4-middleware}

### Middleware Chain

```javascript
// Global middleware (chạy cho mọi namespace)
io.use((socket, next) => {
    console.log("Global: new connection attempt")
    next()
})

// Namespace-specific middleware
io.of("/admin").use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!isAdmin(token)) {
        return next(new Error("Not authorized"))
    }
    socket.data.role = "admin"
    next()
})

io.of("/chat").use((socket, next) => {
    // Lighter auth — chỉ cần logged in
    const token = socket.handshake.auth.token
    if (!isValidUser(token)) {
        return next(new Error("Not authenticated"))
    }
    next()
})
```

### Error Handling

```javascript
// Server
io.of("/admin").use((socket, next) => {
    next(new Error("Admin access required"))
})

// Client
adminSocket.on("connect_error", (err) => {
    console.log(err.message)  // "Admin access required"
    // Client biết rõ lý do bị reject
})
```

### Tầm quan trọng

Middleware per namespace cho phép:
1. **Tiered access control**: public namespace vs authenticated vs admin
2. **Rate limiting per feature**: chat có limit khác analytics
3. **Logging granularity**: log admin actions chi tiết hơn
4. **Feature flags**: enable/disable namespace per environment

---

## 5. Dynamic Namespaces — Multi-tenancy Pattern {#5-dynamic-namespaces}

### Regex-based

```javascript
// Server tạo namespace động theo pattern
io.of(/^\/workspace-\w+$/).on("connection", (socket) => {
    const workspace = socket.nsp.name  // "/workspace-acme"
    console.log(`User joined ${workspace}`)

    socket.on("document:edit", (data) => {
        socket.nsp.emit("document:updated", data)
        // Chỉ broadcast trong workspace này
    })
})

// Client
const acmeSocket = io("/workspace-acme")
const betaSocket = io("/workspace-beta")
// Mỗi workspace là namespace riêng, hoàn toàn isolated
```

### Function-based (advanced validation)

```javascript
io.of((name, auth, next) => {
    // name = "/workspace-acme"
    // auth = { token: "..." }

    const workspaceId = name.split("-")[1]
    const user = validateToken(auth.token)

    if (user.workspaces.includes(workspaceId)) {
        next(null, true)   // Allow
    } else {
        next(null, false)  // Deny — user không thuộc workspace này
    }
})
```

### Parent Namespace Broadcasting

```javascript
const workspaces = io.of(/^\/workspace-\w+$/)

// Middleware chung cho tất cả workspace namespaces
workspaces.use(requireAuth)

// Broadcast cho TẤT CẢ workspaces cùng lúc (admin announcement)
workspaces.emit("system:maintenance", { at: "2024-03-01T00:00:00Z" })
```

### Multi-tenancy Use Cases

```
Tenant A: /workspace-acme
  ├── Room: #general
  ├── Room: #engineering
  └── Room: #sales

Tenant B: /workspace-beta
  ├── Room: #general        ← Hoàn toàn tách biệt với Tenant A
  ├── Room: #design
  └── Room: #marketing

Mỗi tenant:
  - Auth middleware riêng (check tenant membership)
  - Room system riêng
  - Không thể cross-tenant messaging
  - Tất cả trên 1 server cluster
```

---

## 6. Tại sao Namespaces quan trọng cho Pipewave {#6-why-it-matters}

### Use cases mà Pipewave hiện KHÔNG thể handle

#### 6.1 Multi-feature isolation
```
App có 3 real-time features:
  - Chat (cần rooms, typing indicators, read receipts)
  - Notifications (user-based, đơn giản)
  - Live Dashboard (broadcast metrics mỗi giây)

Với Pipewave hiện tại:
  - Tất cả chung 1 message stream
  - MsgType là cách duy nhất để phân biệt
  - Không thể apply logic khác nhau per feature
  - Dashboard broadcast 1msg/s làm noise cho chat handlers
```

#### 6.2 Tiered authorization
```
Cùng 1 app nhưng cần permission levels khác nhau:
  - /public: ai cũng connect được (live scores)
  - /user: cần login (chat, notifications)
  - /admin: cần admin role (user management, monitoring)

Với Pipewave hiện tại:
  - InspectToken trả về 1 user identity cho toàn bộ connection
  - Không có cách restrict access per feature group
  - Admin checks phải nằm trong HandleMessage → business logic bị coupled với auth
```

#### 6.3 Multi-tenant SaaS
```
SaaS platform với nhiều organizations:
  - Org A chỉ thấy data của Org A
  - Org B chỉ thấy data của Org B
  - Admin panel thấy tất cả

Với Pipewave hiện tại:
  - SendToUser gửi cho user, nhưng không có concept "scope"
  - Phải tự quản lý tenant isolation trong HandleMessage
  - Không có native way để broadcast cho "all users in Org A"
```

#### 6.4 Microservice architecture
```
Microservice A (Chat Service) muốn push events
Microservice B (Order Service) muốn push events
Cả 2 đều route qua cùng Pipewave instance

Với Pipewave hiện tại:
  - Cả 2 services gọi SendToUser
  - Không có isolation giữa chat events và order events
  - Client không thể "unsubscribe" khỏi 1 service
```

### Impact Assessment

| Use Case | % Projects cần | Pipewave support |
|----------|----------------|------------------|
| Simple notifications | 30% | Có (SendToUser) |
| Chat with rooms | 25% | **Không** |
| Multi-feature app | 20% | **Không** (workaround bằng MsgType) |
| Multi-tenant | 15% | **Không** |
| Live dashboard | 10% | Partially (broadcast thiếu) |

**Kết luận: Pipewave chỉ cover ~30-40% use cases real-world mà không cần workaround phức tạp.**

---

## 7. Đề xuất thiết kế Namespaces/Channels cho Pipewave {#7-proposal}

### Option A: Full Namespace System (giống Socket.IO)

```go
// Backend
chatNs := pw.Namespace("/chat")
chatNs.Use(requireAuth)
chatNs.OnConnect(func(ctx, user) { /* ... */ })
chatNs.HandleMessage(func(ctx, auth, msgType, data) { /* ... */ })

adminNs := pw.Namespace("/admin")
adminNs.Use(requireAdmin)
adminNs.HandleMessage(func(ctx, auth, msgType, data) { /* ... */ })

// Rooms within namespace
chatNs.JoinRoom(ctx, userID, "room:general")
chatNs.SendToRoom(ctx, "room:general", "CHAT_MSG", data)
chatNs.SendToUser(ctx, userID, "NOTIFICATION", data)
```

```tsx
// Frontend
const { status, send } = usePipewave({
    CHAT_MSG: handleChat,
}, { namespace: "/chat" })

const { send: adminSend } = usePipewave({
    USER_LIST: handleUserList,
}, { namespace: "/admin" })
```

**Pros:** Familiar cho Socket.IO users, full isolation
**Cons:** Complexity cao, thay đổi protocol lớn, nhiều effort

### Option B: Channel System (lightweight, Pipewave-native)

Thay vì copy Socket.IO namespaces, design concept mới phù hợp hơn với Pipewave philosophy:

```go
// Backend — Channels là logical groups có middleware riêng
pw.Channel("chat", ChannelConfig{
    Auth: requireAuth,
    HandleMessage: chatHandler,
})

pw.Channel("admin", ChannelConfig{
    Auth: requireAdmin,
    HandleMessage: adminHandler,
})

// Rooms trong channel
pw.JoinRoom(ctx, "chat", userID, "room:general")
pw.SendToRoom(ctx, "chat", "room:general", "NEW_MSG", data)

// User-based gửi vẫn giữ nguyên
pw.SendToUser(ctx, userID, "NOTIFICATION", data)
```

```tsx
// Frontend — subscribe theo channel
const chat = usePipewave({
    NEW_MSG: handleMsg,
    TYPING: handleTyping,
}, { channel: "chat" })

const admin = usePipewave({
    USER_LIST: renderUsers,
}, { channel: "admin" })
```

**Trên wire, MsgType prefix bằng channel:**
```
Hiện tại:  { t: "CHAT_MSG", b: <data> }
Đề xuất:   { t: "CHAT_MSG", c: "chat", b: <data> }
            hoặc compact: thêm 1 byte channel index vào binary frame
```

**Pros:** Đơn giản hơn namespace, giữ Pipewave philosophy, backward compatible
**Cons:** Ít powerful hơn full namespace system

### Option C: MsgType Convention (zero protocol change)

Không thay đổi protocol. Chỉ cung cấp helper utilities:

```go
// Backend — convention-based routing
pw.HandleMessage(func(ctx, auth, msgType, data) (string, []byte, error) {
    channel, action := pw.ParseType(msgType) // "chat:SEND" → ("chat", "SEND")

    switch channel {
    case "chat":
        return chatRouter.Handle(ctx, auth, action, data)
    case "admin":
        if !auth.IsAdmin {
            return "ERROR", []byte("forbidden"), nil
        }
        return adminRouter.Handle(ctx, auth, action, data)
    }
})
```

```tsx
// Frontend
const chat = usePipewave({
    "chat:NEW_MSG": handleMsg,
    "chat:TYPING": handleTyping,
})
```

**Pros:** Zero breaking change, có thể ship ngay
**Cons:** Không có real isolation, auth vẫn centralized, rooms vẫn thiếu

### Recommendation

**Short-term (pre-open-source):** Option C — ship ngay, documentation convention
**Medium-term (v1.1):** Option B — Channel system lightweight
**Long-term (v2.0, nếu demand cao):** Option A — Full namespace system

Lý do: Pipewave's philosophy là simplicity. Nhảy thẳng vào full namespace system sẽ phá vỡ "2 functions + 1 hook" selling point. Channel system là middle ground — thêm isolation mà không thêm quá nhiều complexity.

---

## Tổng kết

Socket.IO Namespaces không chỉ là 1 feature — nó là **kiến trúc nền tảng** cho phép:
- Logical isolation trên 1 connection
- Per-feature auth & middleware
- Multi-tenancy
- Room scoping
- Microservice event routing

Pipewave thiếu layer này là **gap lớn nhất** so với Socket.IO. Tuy nhiên, approach không nhất thiết phải copy 1:1. Một **Channel system đơn giản** phù hợp với Pipewave philosophy hơn, và có thể cover 80% use cases với 20% complexity của Socket.IO namespaces.

Điều quan trọng nhất: **Room/Group messaging** nên được ưu tiên trước Namespaces. Rooms giải quyết use case phổ biến hơn (chat rooms, game lobbies, collaborative editing), trong khi Namespaces giải quyết architectural concern (isolation, multi-tenancy). Có thể ship Rooms mà chưa cần Namespaces, nhưng ngược lại thì không.
