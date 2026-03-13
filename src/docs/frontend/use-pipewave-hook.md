# usePipewave Hook

The `usePipewave` hook is the primary interface for interacting with Pipewave in React components.

## Basic Usage

```tsx
import { usePipewave } from '@pipewave/react/hooks'
import { useMemo } from 'react'

function MyComponent() {
    const handlers = useMemo(() => ({
        CHAT_MESSAGE: async (data: Uint8Array, messageId: string) => {
            // Handle chat messages
        },
        NOTIFICATION: async (data: Uint8Array, messageId: string) => {
            // Handle notifications
        },
    }), [])

    const { status, send, reconnect, resetRetryCount } = usePipewave(handlers)
}
```

## Handler Registration

Handlers are registered as a key-value map where **keys are message type strings** and **values are async handler functions**.

```tsx
type OnMessage = Record<string, (data: Uint8Array, messageId: string) => Promise<void>>
```

> **Critical:** Always memoize your handlers with `useMemo`. Without memoization, handlers will re-register on every render, causing performance issues.

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Connection status: `'CONNECTING'`, `'READY'`, `'DISCONNECTED'`, `'LONG_POLLING'` |
| `send` | `function` | Send a message to the backend |
| `reconnect` | `function` | Manually trigger a reconnection |
| `resetRetryCount` | `function` | Reset the retry counter (useful after manual reconnect) |

## Sending Messages

```tsx
const { send, status } = usePipewave()
const encoder = new TextEncoder()

const sendMessage = () => {
    send({
        id: crypto.randomUUID(),
        msgType: 'CHAT_SEND',
        data: encoder.encode(JSON.stringify({
            roomId: 'room_1',
            content: 'Hello world',
        })),
    })
}

return (
    <button onClick={sendMessage} disabled={status !== 'READY'}>
        Send
    </button>
)
```

## Connection Status

Use the `status` value to show connection state in your UI:

```tsx
function StatusIndicator() {
    const { status } = usePipewave()

    const colors = {
        CONNECTING: 'bg-yellow-400',
        READY: 'bg-green-400',
        DISCONNECTED: 'bg-red-400',
        LONG_POLLING: 'bg-blue-400',
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
            <span>{status}</span>
        </div>
    )
}
```

## Multiple Hooks

You can use `usePipewave` in multiple components simultaneously. Each component registers its own set of handlers, and all handlers for the same message type will be called:

```tsx
// Component A subscribes to CHAT_MESSAGE
usePipewave({ CHAT_MESSAGE: handleChatA })

// Component B also subscribes to CHAT_MESSAGE
usePipewave({ CHAT_MESSAGE: handleChatB })

// Both handleChatA and handleChatB will fire when a CHAT_MESSAGE arrives
```
