# Customization

## Backend: Custom Message Handling

### Example 1: Simple Chat

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    switch inputType {
    case "CHAT_SEND":
        // auth.Username contains the sender's username
        response := fmt.Sprintf("[%s]: %s", auth.Username, string(data))
        return "CHAT_MESSAGE", []byte(response), nil
    default:
        return "", nil, nil
    }
},
```

### Example 2: JSON Processing

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
        // Process business logic...
        return "PROFILE_UPDATED", []byte(`{"status":"ok"}`), nil
    default:
        return "", nil, nil
    }
},
```

### Example 3: Broadcast to Multiple Users

```go
// Get WebSocket service
ws := appDI.Delivery.Services().Websocket()

// Send to a specific user
ws.SendToUser(ctx, "alice", "NOTIFICATION", []byte("You have a new message"))

// Send to multiple users (in HandleMessage or a background goroutine)
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    if inputType == "BROADCAST_TO_ROOM" {
        // Assuming you have a list of users in the room
        users := []string{"alice", "bob", "charlie"}
        for _, user := range users {
            ws.SendToUser(ctx, user, "ROOM_MESSAGE", data)
        }
        return "", nil, nil  // No direct response needed
    }
    return "", nil, nil
},
```

---

## Backend: Custom Authentication

### Using JWT

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

### Supporting Anonymous Users

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    if token == "" {
        // Create anonymous username
        return "anon-" + uuid.New().String()[:8], true, nil
    }
    // Normal token authentication...
    return validateToken(token)
},
```

---

## Backend: Connection Hooks

You can perform actions when a user connects/disconnects:

```go
configprovider.FromYaml(
    []string{"./config.yaml"},
    &configprovider.Fns{
        InspectToken:  myInspectToken,
        HandleMessage: myHandleMessage,

        // Called when a user successfully connects
        OnNewConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
            fmt.Printf("User %s connected\n", auth.Username)
            // Update online status, notify friends, etc.
        },

        // Called when a user disconnects
        OnCloseConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
            fmt.Printf("User %s disconnected\n", auth.Username)
            // Update offline status, etc.
        },
    },
)
```

---

## Backend: Switching to DynamoDB

1. Enable DynamoDB local in `docker-compose.yml`:

```yaml
# Uncomment this section:
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

2. Change the import in `playground/main.go`:

```go
// Replace this line:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-postgres"

// With:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-dynamodb"
```

3. Update the initialization:

```go
appDI := app.NewPipewave(
    config,
    slog.Default(),
    ddbRepo.NewDynamoDBRepo,      // Replace NewPostgresRepo
    queueprovider.QueueValkey,
)
```

4. Make sure `config.yaml` has the DynamoDB configuration section (already included in playground/config.yaml).

---

## Frontend: Integrating into an Existing React Project

### Step 1: Install the Package

```bash
npm install @ponos/echowave
```

### Step 2: Create Config

```tsx
// src/config/echowave.ts
import { PipewaveModuleConfig } from '@ponos/echowave/context'

export const echowaveConfig = new PipewaveModuleConfig({
    backendEndpoint: 'your-backend-host.com/websocket',
    insecure: false,       // false = use wss:// (production)
    debugMode: false,
    getAccessToken: async () => {
        // Get token from your auth service
        const token = localStorage.getItem('access_token')
        return token ?? ''
    },
})
```

### Step 3: Wrap the App with Provider

```tsx
// src/App.tsx
import { PipewaveProvider } from '@ponos/echowave/context'
import { echowaveConfig } from './config/echowave'

const eventHandler = {}  // Or add custom handlers

function App() {
    return (
        <PipewaveProvider config={echowaveConfig} eventHandler={eventHandler}>
            {/* App components */}
        </PipewaveProvider>
    )
}
```

### Step 4: Use the Hook in Components

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

## Frontend: WebSocket Event Handling

`eventHandler` allows you to handle connection-level events:

```tsx
import type { WebsocketEventHandler } from '@ponos/echowave'

const eventHandler: WebsocketEventHandler = {
    onOpen: async () => {
        console.log('WebSocket connected!')
        // Update UI, send analytics, etc.
    },
    onClose: async () => {
        console.log('WebSocket disconnected')
    },
    onError: async (error) => {
        console.error('WebSocket error:', error)
        // Send error report
    },
    onMaxRetry: async (resetRetryCount) => {
        console.warn('Max retry reached')
        // Show notification to user
        // Call resetRetryCount() to try again
    },
}
```

---

## Frontend: Handling Error Messages from Server

In addition to data handlers, you can register error handlers for each message type:

```tsx
import { usePipewave, type OnMessage, type OnError } from '@ponos/echowave/hooks'

const onMessage: OnMessage = useMemo(() => ({
    'CHAT_MESSAGE': async (data, id) => { /* handle message */ },
}), [])

const onError: OnError = useMemo(() => ({
    'CHAT_MESSAGE': async (errorMsg, id) => {
        console.error(`Message ${id} failed:`, errorMsg)
        // Show error notification to user
    },
}), [])

const { status, send } = usePipewave(onMessage, onError)
```

---

## Project Structure Summary

```
echo-wave/
├── echowave-backend/           # Backend (Golang)
│   ├── playground/
│   │   ├── main.go             # ← Entry point - customize here
│   │   └── config.yaml         # ← Playground config
│   ├── config.yaml             # ← Main config (PostgreSQL)
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
│   │       └── Example.tsx     # ← Example page
│   └── package.json
│
├── example/                    # Example using published package
│   ├── src/App.tsx
│   └── package.json
│
└── docpages/                   # Documentation
```
