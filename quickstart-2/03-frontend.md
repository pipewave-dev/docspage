# Frontend

Package: `@ponos/echowave` — exports `./context` (Provider + Config) và `./hooks` (usePipewave).

## Setup

### 1. Config

```tsx
import { PipewaveModuleConfig } from '@ponos/echowave/context'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',  // không cần ws:// hay http://
    insecure: true,        // true = ws:// + http://, false = wss:// + https://
    debugMode: true,
    getAccessToken: async () => {
        return localStorage.getItem('access_token') ?? ''
    },
})
```

### 2. Provider

```tsx
import { PipewaveProvider } from '@ponos/echowave/context'

function App() {
    return (
        <PipewaveProvider config={config} eventHandler={eventHandler}>
            <YourApp />
        </PipewaveProvider>
    )
}
```

`config` và `eventHandler` phải có **stable reference** (khai báo ngoài component hoặc `useMemo`). Reference thay đổi → WebSocket reconnect.

### 3. usePipewave Hook

```tsx
import { usePipewave, type OnMessage, type OnError } from '@ponos/echowave/hooks'

function Chat() {
    const [messages, setMessages] = useState<string[]>([])
    const decoder = useMemo(() => new TextDecoder(), [])
    const encoder = useMemo(() => new TextEncoder(), [])

    const onMessage: OnMessage = useMemo(() => ({
        'CHAT_NEW': async (data: Uint8Array, id: string) => {
            setMessages(prev => [...prev, decoder.decode(data)])
        },
        'TYPING_INDICATOR': async (data: Uint8Array) => {
            // handle typing...
        },
    }), [])

    const onError: OnError = useMemo(() => ({
        'CHAT_NEW': async (errorMsg: string, id: string) => {
            console.error(`Message ${id} failed:`, errorMsg)
        },
    }), [])

    const { status, send, resetRetryCount, reconnect } = usePipewave(onMessage, onError)

    const handleSend = (text: string) => {
        send({
            id: crypto.randomUUID(),
            msgType: 'CHAT_SEND',
            data: encoder.encode(text),   // data luôn là Uint8Array
        })
    }
}
```

### API Reference

| Return value | Type | Description |
|---|---|---|
| `status` | `string` | `"CONNECTING"` → `"READY"` → `"CLOSED"` / `"SUSPEND"` |
| `send` | `(msg: WebsocketMessage) => void` | Gửi `{ id, msgType, data: Uint8Array }` |
| `resetRetryCount` | `() => void` | Reset retry counter khi ở SUSPEND |
| `reconnect` | `() => void` | Ngắt + kết nối lại |

### Message Format

Tất cả data gửi/nhận đều là `Uint8Array`. Encode/decode tuỳ nhu cầu:

```tsx
// Text
encoder.encode("hello")
decoder.decode(data)

// JSON
encoder.encode(JSON.stringify({ name: "Alice" }))
JSON.parse(decoder.decode(data))

// Binary: dùng trực tiếp Uint8Array
```

## Event Handler

Xử lý connection-level events:

```tsx
import type { WebsocketEventHandler } from '@ponos/echowave'

const eventHandler: WebsocketEventHandler = {
    onOpen: async () => { /* connected */ },
    onClose: async () => { /* disconnected */ },
    onError: async (error) => { /* ws error */ },
    onMaxRetry: async (resetRetryCount) => {
        // Max retry reached — show UI, call resetRetryCount() to retry
    },
}
```

## Transport Fallback

```
WebSocket → fail (max retry) → auto-switch Long Polling
                              → lưu vào sessionStorage
                              → các lần sau dùng LP luôn (trong cùng session)
```

Force Long Polling (debug):

```javascript
localStorage.setItem('FORCE_LONG_POLLING', 'true')
// Xoá: localStorage.removeItem('FORCE_LONG_POLLING')
```
