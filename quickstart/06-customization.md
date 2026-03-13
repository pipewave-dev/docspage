# Tuỳ chỉnh cho dự án của bạn

## Backend: Tuỳ chỉnh xử lý message

### Ví dụ 1: Chat đơn giản

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    switch inputType {
    case "CHAT_SEND":
        // auth.Username chứa username của người gửi
        response := fmt.Sprintf("[%s]: %s", auth.Username, string(data))
        return "CHAT_MESSAGE", []byte(response), nil
    default:
        return "", nil, nil
    }
},
```

### Ví dụ 2: Xử lý JSON

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    switch inputType {
    case "UPDATE_PROFILE":
        var req struct {
            DisplayName string `json:"display_name"`
        }
        if err := json.Unmarshal(data, &req); err != nil {
            return "ERROR", []byte("invalid JSON"), nil
        }
        // Xử lý business logic...
        return "PROFILE_UPDATED", []byte(`{"status":"ok"}`), nil
    default:
        return "", nil, nil
    }
},
```

### Ví dụ 3: Broadcast tới nhiều user

```go
// Lấy WebSocket service
ws := appDI.Delivery.Services().Websocket()

// Gửi tới 1 user cụ thể
ws.SendToUser(ctx, "alice", "NOTIFICATION", []byte("Bạn có tin nhắn mới"))

// Gửi tới nhiều user (trong HandleMessage hoặc background goroutine)
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    if inputType == "BROADCAST_TO_ROOM" {
        // Giả sử bạn có danh sách user trong room
        users := []string{"alice", "bob", "charlie"}
        for _, user := range users {
            ws.SendToUser(ctx, user, "ROOM_MESSAGE", data)
        }
        return "", nil, nil  // Không cần trả response trực tiếp
    }
    return "", nil, nil
},
```

---

## Backend: Tuỳ chỉnh xác thực

### Dùng JWT

```go
import "github.com/golang-jwt/jwt/v5"

InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    token = strings.TrimPrefix(token, "Bearer ")

    claims := jwt.MapClaims{}
    _, err = jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
        return []byte("your-secret-key"), nil
    })
    if err != nil {
        return "", false, fmt.Errorf("invalid token: %w", err)
    }

    username, ok := claims["sub"].(string)
    if !ok {
        return "", false, fmt.Errorf("missing username in token")
    }
    return username, false, nil
},
```

### Hỗ trợ Anonymous User

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    if token == "" {
        // Tạo anonymous username
        return "anon-" + uuid.New().String()[:8], true, nil
    }
    // Xác thực token bình thường...
    return validateToken(token)
},
```

---

## Backend: Hook kết nối

Bạn có thể thực hiện hành động khi user kết nối/ngắt kết nối:

```go
configprovider.FromYaml(
    []string{"./config.yaml"},
    &configprovider.Fns{
        InspectToken:  myInspectToken,
        HandleMessage: myHandleMessage,

        // Được gọi khi user kết nối thành công
        OnNewConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
            fmt.Printf("User %s connected\n", auth.Username)
            // Cập nhật status online, notify bạn bè, v.v.
        },

        // Được gọi khi user ngắt kết nối
        OnCloseConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
            fmt.Printf("User %s disconnected\n", auth.Username)
            // Cập nhật status offline, v.v.
        },
    },
)
```

---

## Backend: Chuyển sang DynamoDB

1. Bật DynamoDB local trong `docker-compose.yml`:

```yaml
# Uncomment phần này:
dynamodb-local:
  command: "-jar DynamoDBLocal.jar -port 29101 -sharedDb -dbPath ./data"
  image: "amazon/dynamodb-local:latest"
  ports:
    - "29101:29101"
  volumes:
    - ./tmp/dynamodb-data:/home/dynamodblocal/data
  working_dir: /home/dynamodblocal
  networks:
    - pipewave
```

2. Thay đổi import trong `playground/main.go`:

```go
// Thay dòng này:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-postgres"

// Thành:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-dynamodb"
```

3. Cập nhật khởi tạo:

```go
appDI := app.NewPipewave(
    config,
    slog.Default(),
    ddbRepo.NewDynamoDBRepo,      // Thay NewPostgresRepo
    queueprovider.QueueValkey,
)
```

4. Đảm bảo `config.yaml` có phần cấu hình DynamoDB (đã có sẵn trong playground/config.yaml).

---

## Frontend: Tích hợp vào project React có sẵn

### Bước 1: Cài đặt package

```bash
npm install @ponos/echowave
```

### Bước 2: Tạo config

```tsx
// src/config/echowave.ts
import { PipewaveModuleConfig } from '@ponos/echowave/context'

export const echowaveConfig = new PipewaveModuleConfig({
    backendEndpoint: 'your-backend-host.com/websocket',
    insecure: false,       // false = dùng wss:// (production)
    debugMode: false,
    getAccessToken: async () => {
        // Lấy token từ auth service của bạn
        const token = localStorage.getItem('access_token')
        return token ?? ''
    },
})
```

### Bước 3: Wrap app với Provider

```tsx
// src/App.tsx
import { PipewaveProvider } from '@ponos/echowave/context'
import { echowaveConfig } from './config/echowave'

const eventHandler = {}  // Hoặc thêm custom handlers

function App() {
    return (
        <PipewaveProvider config={echowaveConfig} eventHandler={eventHandler}>
            {/* App components */}
        </PipewaveProvider>
    )
}
```

### Bước 4: Dùng hook trong component

```tsx
// src/components/Notifications.tsx
import { usePipewave, type OnMessage } from '@ponos/echowave/hooks'
import { useMemo, useState } from 'react'

const decoder = new TextDecoder()

function Notifications() {
    const [notifications, setNotifications] = useState<string[]>([])

    const onMessage: OnMessage = useMemo(() => ({
        'NOTIFICATION': async (data: Uint8Array) => {
            const text = decoder.decode(data)
            setNotifications(prev => [text, ...prev])
        },
    }), [])

    const { status } = usePipewave(onMessage)

    return (
        <div>
            <p>Connection: {status}</p>
            {notifications.map((n, i) => (
                <div key={i}>{n}</div>
            ))}
        </div>
    )
}
```

---

## Frontend: Xử lý event WebSocket

`eventHandler` cho phép bạn xử lý các sự kiện ở mức connection:

```tsx
import type { WebsocketEventHandler } from '@ponos/echowave'

const eventHandler: WebsocketEventHandler = {
    onOpen: async () => {
        console.log('WebSocket connected!')
        // Cập nhật UI, gửi analytics, v.v.
    },
    onClose: async () => {
        console.log('WebSocket disconnected')
    },
    onError: async (error) => {
        console.error('WebSocket error:', error)
        // Gửi error report
    },
    onMaxRetry: async (resetRetryCount) => {
        console.warn('Max retry reached')
        // Hiển thị thông báo cho user
        // Gọi resetRetryCount() để thử lại
    },
}
```

---

## Frontend: Xử lý error message từ server

Ngoài data handler, bạn có thể đăng ký error handler cho từng message type:

```tsx
import { usePipewave, type OnMessage, type OnError } from '@ponos/echowave/hooks'

const onMessage: OnMessage = useMemo(() => ({
    'CHAT_MESSAGE': async (data, id) => { /* xử lý message */ },
}), [])

const onError: OnError = useMemo(() => ({
    'CHAT_MESSAGE': async (errorMsg, id) => {
        console.error(`Message ${id} failed:`, errorMsg)
        // Hiển thị thông báo lỗi cho user
    },
}), [])

const { status, send } = usePipewave(onMessage, onError)
```

---

## Tổng kết cấu trúc dự án

```
echo-wave/
├── echowave-backend/           # Backend (Golang)
│   ├── playground/
│   │   ├── main.go             # ← Entry point - tuỳ chỉnh ở đây
│   │   └── config.yaml         # ← Cấu hình cho playground
│   ├── config.yaml             # ← Cấu hình chính (có PostgreSQL)
│   ├── docker-compose.yml      # ← Infrastructure
│   ├── app/                    # Wire DI
│   ├── core/                   # Business logic
│   └── provider/               # Config, Queue providers
│
├── echowave-femodule/          # Frontend module (TypeScript/React)
│   ├── src/
│   │   ├── context/
│   │   │   ├── provider.tsx    # ← PipewaveProvider
│   │   │   └── types.ts        # ← PipewaveModuleConfig
│   │   ├── hooks/
│   │   │   └── usePipewave.ts  # ← usePipewave hook
│   │   ├── external/pipewave/  # WebSocket/Long Polling implementation
│   │   └── pages/
│   │       └── Example.tsx     # ← Trang ví dụ
│   └── package.json
│
├── example/                    # Ví dụ sử dụng package đã publish
│   ├── src/App.tsx
│   └── package.json
│
└── docpages/                   # Documentation
```
