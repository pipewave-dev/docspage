# Tutorial: Build a Chat App in 15 Minutes

This tutorial walks you through building a complete real-time chat application with Pipewave — from zero to working app.

> **Prerequisites:** Go 1.21+, Node.js 18+, Docker (for Valkey & PostgreSQL). See [Getting Started](/docs) for details.

## What You'll Build

A simple chat app where:
- Users authenticate with a token
- Users send messages to each other in real time
- The UI shows connection status and incoming messages

## Step 1: Set Up Infrastructure

Create a `docker-compose.yml` for Valkey (Redis-compatible) and PostgreSQL:

```yaml
version: '3.8'
services:
  valkey:
    image: valkey/valkey:7
    ports:
      - "6379:6379"
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: pipewave
      POSTGRES_PASSWORD: pipewave
      POSTGRES_DB: pipewave
```

Start the services:

```bash
docker compose up -d
```

## Step 2: Create the Go Backend

Initialize a Go project:

```bash
mkdir chat-backend && cd chat-backend
go mod init chat-backend
go get github.com/pipewave-dev/go-pkg
```

Create `main.go`:

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"

    "github.com/pipewave-dev/go-pkg"
    "github.com/pipewave-dev/go-pkg/config/configprovider"
    postgresRepo "github.com/pipewave-dev/go-pkg/core/adapter/repository/postgres"
    "github.com/pipewave-dev/go-pkg/core/adapter/queue/queueprovider"
)

func main() {
    pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
        ConfigStore: configprovider.FromGoStruct(pipewave.ConfigEnv{
            Env:     "development",
            PodName: "local-1",
            Version: "0.1.0",
            WorkerPool: pipewave.WorkerPoolConfig{
                Buffer: 256,
            },
            CORS: pipewave.CORSConfig{
                Enabled:        true,
                ExactlyOrigins: []string{"http://localhost:5173"},
            },
            Valkey: pipewave.ValkeyConfig{
                PrimaryAddress: "localhost:6379",
            },
            Postgres: pipewave.PostgresConfig{
                CreateTables: true,
                Host:         "localhost",
                Port:         5432,
                DBName:       "pipewave",
                User:         "pipewave",
                Password:     "pipewave",
            },
        }),
        RepositoryFactory: postgresRepo.NewPostgresRepo,
        QueueFactory:      queueprovider.QueueValkey,
    })

    pw.SetFns(&pipewave.FunctionStore{
        InspectToken:  inspectToken,
        HandleMessage: &chatHandler{i: pw},
    })

    mux := http.NewServeMux()
    mux.Handle("/pipewave/", http.StripPrefix("/pipewave", pw.Mux()))

    server := &http.Server{Addr: ":8080", Handler: mux}
    go func() {
        log.Println("Server starting on :8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down...")
    pw.Shutdown()
    server.Shutdown(context.Background())
}
```

## Step 3: Implement Authentication

Add the `InspectToken` function to `main.go`. For this tutorial, we'll use a simple token format `user:<username>`:

```go
func inspectToken(ctx context.Context, token string) (string, bool, error) {
    // Simple token format: "user:alice" → userID = "alice"
    // In production, use JWT validation or API key lookup
    if len(token) > 5 && token[:5] == "user:" {
        userID := token[5:]
        return userID, false, nil
    }
    return "", false, fmt.Errorf("invalid token format")
}
```

## Step 4: Implement the Message Handler

Create `handler.go`:

```go
package main

import (
    "context"
    "time"

    "github.com/pipewave-dev/go-pkg/core/delivery"
    voAuth "github.com/pipewave-dev/go-pkg/core/domain/value-object/auth"
    "github.com/vmihailenco/msgpack/v5"
)

const (
    MsgTypeChatSend     = "CHAT_SEND"
    MsgTypeChatIncoming = "CHAT_INCOMING"
    MsgTypeChatAck      = "CHAT_ACK"
    MsgTypeChatError    = "CHAT_ERROR"
)

type ChatSendPayload struct {
    ToUserID string `msgpack:"to_user_id"`
    Content  string `msgpack:"content"`
}

type ChatIncomingPayload struct {
    FromUserID string `msgpack:"from_user_id"`
    Content    string `msgpack:"content"`
    Timestamp  int64  `msgpack:"timestamp"`
}

type ChatAckPayload struct {
    Ok bool `msgpack:"ok"`
}

type ChatErrorPayload struct {
    Reason string `msgpack:"reason"`
}

type chatHandler struct {
    i delivery.ModuleDelivery
}

func (h *chatHandler) HandleMessage(
    ctx context.Context,
    auth voAuth.WebsocketAuth,
    inputType string,
    data []byte,
) (string, []byte, error) {
    switch inputType {
    case MsgTypeChatSend:
        return h.handleChatSend(ctx, auth, data)
    default:
        // Echo unknown message types back
        return "ECHO", data, nil
    }
}

func (h *chatHandler) handleChatSend(
    ctx context.Context,
    auth voAuth.WebsocketAuth,
    data []byte,
) (string, []byte, error) {
    var msg ChatSendPayload
    if err := msgpack.Unmarshal(data, &msg); err != nil {
        errData, _ := msgpack.Marshal(ChatErrorPayload{Reason: "Invalid payload"})
        return MsgTypeChatError, errData, nil
    }

    // Send the message to the target user
    incoming := ChatIncomingPayload{
        FromUserID: auth.UserID,
        Content:    msg.Content,
        Timestamp:  time.Now().Unix(),
    }
    incomingData, _ := msgpack.Marshal(incoming)

    err := h.i.Services().SendToUser(ctx, msg.ToUserID, MsgTypeChatIncoming, incomingData)
    if err != nil {
        errData, _ := msgpack.Marshal(ChatErrorPayload{Reason: "Failed to deliver message"})
        return MsgTypeChatError, errData, nil
    }

    ackData, _ := msgpack.Marshal(ChatAckPayload{Ok: true})
    return MsgTypeChatAck, ackData, nil
}
```

Run the backend:

```bash
go run .
# Output: Server starting on :8080
```

## Step 5: Create the React Frontend

In a new terminal, scaffold a React project:

```bash
npm create vite@latest chat-frontend -- --template react-ts
cd chat-frontend
npm install @pipewave/reactpkg @msgpack/msgpack
```

## Step 6: Set Up PipewaveProvider

Replace `src/App.tsx`:

```tsx
import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/reactpkg'
import { ChatRoom } from './ChatRoom'
import { useState } from 'react'

// Simple auth: user enters their name, token = "user:<name>"
export default function App() {
    const [username, setUsername] = useState('')
    const [joined, setJoined] = useState(false)

    if (!joined) {
        return (
            <div style={{ padding: 20 }}>
                <h1>Pipewave Chat</h1>
                <input
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && username && setJoined(true)}
                />
                <button onClick={() => username && setJoined(true)}>Join</button>
            </div>
        )
    }

    const config = new PipewaveModuleConfig({
        backendEndpoint: 'localhost:8080/pipewave',
        insecure: true,
        debugMode: true,
        getAccessToken: async () => `user:${username}`,
    })

    return (
        <PipewaveProvider
            config={config}
            eventHandler={{
                onOpen: async () => console.log('Connected as', username),
                onClose: async () => console.log('Disconnected'),
                onError: async (err) => console.error('Error:', err),
            }}
        >
            <ChatRoom username={username} />
        </PipewaveProvider>
    )
}
```

## Step 7: Build the Chat Component

Create `src/ChatRoom.tsx`:

```tsx
import { usePipewave, type OnMessage } from '@pipewave/reactpkg'
import { encode, decode } from '@msgpack/msgpack'
import { useMemo, useState } from 'react'

interface Message {
    from: string
    content: string
    timestamp: number
}

export function ChatRoom({ username }: { username: string }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [targetUser, setTargetUser] = useState('')

    const onMessage: OnMessage = useMemo(() => ({
        CHAT_INCOMING: async (data: Uint8Array) => {
            const payload = decode(data) as {
                from_user_id: string
                content: string
                timestamp: number
            }
            setMessages(prev => [...prev, {
                from: payload.from_user_id,
                content: payload.content,
                timestamp: payload.timestamp,
            }])
        },
        CHAT_ACK: async () => {
            console.log('Message delivered')
        },
        CHAT_ERROR: async (data: Uint8Array) => {
            const payload = decode(data) as { reason: string }
            console.error('Chat error:', payload.reason)
        },
    }), [])

    const { status, send, resetRetryCount } = usePipewave(onMessage)

    const sendMessage = () => {
        if (!input || !targetUser) return
        send({
            id: crypto.randomUUID(),
            msgType: 'CHAT_SEND',
            data: encode({ to_user_id: targetUser, content: input }),
        })
        // Add to local messages
        setMessages(prev => [...prev, {
            from: username,
            content: input,
            timestamp: Date.now() / 1000,
        }])
        setInput('')
    }

    return (
        <div style={{ padding: 20, maxWidth: 600 }}>
            <h2>Chat as: {username}</h2>
            <p>
                Status:{' '}
                <strong style={{ color: status === 'READY' ? 'green' : 'red' }}>
                    {status}
                </strong>
                {status === 'SUSPEND' && (
                    <button onClick={resetRetryCount} style={{ marginLeft: 8 }}>
                        Retry Connection
                    </button>
                )}
            </p>

            <div style={{ border: '1px solid #ccc', padding: 12, height: 300, overflowY: 'auto', marginBottom: 12 }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                        <strong>{msg.from}:</strong> {msg.content}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    placeholder="Send to user..."
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    style={{ width: 120 }}
                />
                <input
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    style={{ flex: 1 }}
                />
                <button onClick={sendMessage} disabled={status !== 'READY'}>
                    Send
                </button>
            </div>
        </div>
    )
}
```

## Step 8: Test It

1. Start the frontend:

```bash
npm run dev
# Opens at http://localhost:5173
```

2. Open **two browser tabs** at `http://localhost:5173`
3. In tab 1, enter username **alice** and click Join
4. In tab 2, enter username **bob** and click Join
5. In tab 1, set "Send to user" as **bob**, type a message, and hit Send
6. You should see the message appear in tab 2 in real time!

## What Just Happened?

```
Alice's Browser                    Server                     Bob's Browser
     │                               │                              │
     │── CHAT_SEND {to: "bob"} ────►│                              │
     │                               │── InspectToken("user:alice") │
     │                               │── HandleMessage(CHAT_SEND)   │
     │                               │                              │
     │◄── CHAT_ACK ─────────────────│                              │
     │                               │── SendToUser("bob") ────────►│
     │                               │                              │
     │                               │        CHAT_INCOMING ───────►│
```

1. Alice's `send()` call encodes the message and sends it over WebSocket
2. Pipewave validates Alice's token via `InspectToken`
3. `HandleMessage` receives the `CHAT_SEND` message, processes it
4. `SendToUser("bob", ...)` delivers the message to all of Bob's connections
5. Bob's `onMessage` handler fires and updates the UI

## Next Steps

Now that you have a working app, explore:

- [InspectToken](/docs/backend/inspect-fn) — Replace the simple token with JWT or API key auth
- [Module API](/docs/backend/module-api) — Use `CheckOnline()`, `SendToSession()`, lifecycle callbacks
- [Configuration](/docs/backend/configuration) — Tune worker pools, rate limiting, CORS
- [Binary Protocol](/docs/frontend/binary-protocol) — Understand the MessagePack encoding
- [Scaling](/docs/backend/scaling) — Deploy multiple instances with Kubernetes
