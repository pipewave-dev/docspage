# Frontend

Package: `@ponos/echowave` — exports `./context` (Provider + Config) and `./hooks` (usePipewave).

## Setup

### 1. Config

```tsx
import { PipewaveModuleConfig } from '@ponos/echowave/context'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',  // no need for ws:// or http://
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

`config` and `eventHandler` must have a **stable reference** (declared outside the component or with `useMemo`). Changing the reference → WebSocket reconnects.

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
            data: encoder.encode(text),   // data is always Uint8Array
        })
    }
}
```

### API Reference

| Return value | Type | Description |
|---|---|---|
| `status` | `string` | `"CONNECTING"` → `"READY"` → `"CLOSED"` / `"SUSPEND"` |
| `send` | `(msg: WebsocketMessage) => void` | Send `{ id, msgType, data: Uint8Array }` |
| `resetRetryCount` | `() => void` | Reset retry counter when in SUSPEND |
| `reconnect` | `() => void` | Disconnect + reconnect |

### Message Format

All data sent/received is `Uint8Array`. Encode/decode as needed:

```tsx
// Text
encoder.encode("hello")
decoder.decode(data)

// JSON
encoder.encode(JSON.stringify({ name: "Alice" }))
JSON.parse(decoder.decode(data))

// Binary: use Uint8Array directly
```

## Event Handler

Handle connection-level events:

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
                              → saved to sessionStorage
                              → subsequent connections use LP directly (within same session)
```

Force Long Polling (debug):

```javascript
localStorage.setItem('FORCE_LONG_POLLING', 'true')
// Remove: localStorage.removeItem('FORCE_LONG_POLLING')
```
