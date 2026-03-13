# Pipewave Frontend Integration

The Pipewave frontend module (FeModule) abstractly handles the intricacies of WebSocket management, Long-Polling fallbacks, heartbeats, and binary payload decoding. It makes interacting with real-time multiplexed streams remarkably simple in React/TypeScript projects.

## 1. Provider Configuration

To begin, wrap your application in the `PipewaveProvider`. You'll supply it with an `PipewaveModuleConfig` object that tells it how to locate your backend and acquire access tokens.

```tsx
import { PipewaveProvider, PipewaveModuleConfig } from '@/context'
import type { WebsocketEventHandler } from '@/external/pipewave'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'api.example.com/websocket',
    insecure: false, // Set true for ws:// instead of wss://
    debugMode: process.env.NODE_ENV !== 'production',
    
    // Asynchronous token fetcher executed before connections
    getAccessToken: async () => localStorage.getItem("auth_token") || "anonymous",
})

// Optional global event handlers (e.g. for logging disconnects)
const eventHandler: WebsocketEventHandler = {}

export default function App() {
    return (
        <PipewaveProvider config={config} eventHandler={eventHandler}>
            <YourApplication />
        </PipewaveProvider>
    )
}
```

## 2. The `usePipewave` React Hook

The most powerful feature of the frontend module is the `usePipewave` hook. It manages your component's subscription state and multiplexes incoming packets into specific functions based on their string `Type`.

### Handling Specific Event Types

```tsx
import { usePipewave, type OnMessage } from '@/hooks/usePipewave'
import { useMemo, useState } from 'react'

const EVENT_NEW_MSG = 'CHAT_MESSAGE_CREATED'

function ChatComponent() {
    const [messages, setMessages] = useState([])
    const decoder = new TextDecoder()

    // 1. Define your multi-plex handlers based on String type.
    // ⚠️ CRITICAL: Memoize this object or handlers will re-register on every render!
    const onMessage: OnMessage = useMemo(() => ({
        [EVENT_NEW_MSG]: async (data: Uint8Array, messageId: string) => {
            // Process the binary payload
            const payload = JSON.parse(decoder.decode(data))
            
            // Note: Use functional state updates to avoid stale closures
            setMessages(prev => [...prev, payload])
        }
    }), [])

    // 2. Attach the hook
    const { status, send, reconnect, resetRetryCount } = usePipewave(onMessage)

    return (
        <div>
            <div>Connection Status: {status}</div>
            {/* Render Chat... */}
        </div>
    )
}
```

### Sending Messages

Use the `send` function exported from the hook to push data to the backend handler.

```tsx
function SendingExample() {
    const { send, status } = usePipewave()
    const encoder = new TextEncoder()

    const dispatchAction = () => {
        send({
            id: crypto.randomUUID(),
            msgType: 'PROCESS_ACTION',
            data: encoder.encode(JSON.stringify({ actionId: 123 }))
        })
    }

    return (
        <button onClick={dispatchAction} disabled={status !== 'READY'}>
            Trigger Action
        </button>
    )
}
```

## 3. Automatic Resilience

The frontend API utilizes the `WebsocketApi` class under the hood (`src/external/pipewave/websocket-api.ts`), providing robust resilience patterns out of the box:

* **Automatic Reconnects**: Dropouts are instantly detected and connection attempts retry with exponential backoff.
* **Long Polling Fallback**: If the `onMaxRetry` threshold is reached (e.g., enterprise firewalls blocking WebSockets), the active transport transparently falls back to `LongPollingService` without any interruption to the `usePipewave` API.
* **Transparent Heartbeats**: The `"<3"` message type is dealt with entirely by the library, keeping proxy connections like NGINX/ALB alive without manual `setInterval` management on your components.
