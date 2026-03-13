# usePipewave Hook

The `usePipewave` hook is the primary interface for interacting with Pipewave in React components.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## Basic Usage

```tsx
import { usePipewave, type OnMessage } from '@pipewave/reactpkg'
import { decode } from '@msgpack/msgpack'
import { useMemo } from 'react'

function MyComponent() {
    const onMessage: OnMessage = useMemo(() => ({
        CHAT_INCOMING_MSG: async (data: Uint8Array, id: string) => {
            const payload = decode(data) as ChatIncomingMsg
            // Handle incoming message
        },
        CHAT_ACK: async (_: Uint8Array, id: string) => {
            // Handle acknowledgment
        },
    }), [])

    const { status, send, resetRetryCount } = usePipewave(onMessage)
}
```

## Handler Registration

Handlers are registered as a key-value map where **keys are message type strings** and **values are async handler functions**:

```tsx
type OnMessage = Record<string, (data: Uint8Array, messageId: string) => Promise<void>>
```

> **Critical:** Always memoize your handlers with `useMemo`. Without memoization, handlers will re-register on every render, causing performance issues.

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Connection status: `'READY'`, `'SUSPEND'`, etc. |
| `send` | `function` | Send a message to the backend |
| `resetRetryCount` | `function` | Reset the retry counter and attempt reconnection |

## Sending Messages

Use MessagePack encoding for efficient binary data:

```tsx
import { encode } from '@msgpack/msgpack'

const { send, status } = usePipewave(onMessage)

const sendMessage = () => {
    send({
        id: crypto.randomUUID(),
        msgType: 'CHAT_SEND_MSG',
        data: encode({
            to_user_id: 'user_123',
            content: 'Hello world',
        }),
    })
}

return (
    <button onClick={sendMessage} disabled={status !== 'READY'}>
        Send
    </button>
)
```

### Send Parameters

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique message ID (use `crypto.randomUUID()`) |
| `msgType` | `string` | Message type matching your backend handler |
| `data` | `Uint8Array` | Binary payload (use `encode()` from `@msgpack/msgpack`) |

## Connection Status

Use the `status` value to show connection state in your UI:

```tsx
function StatusIndicator() {
    const { status, resetRetryCount } = usePipewave(useMemo(() => ({}), []))

    return (
        <div>
            <span style={{ color: status === 'READY' ? 'green' : 'red', fontWeight: 'bold' }}>
                {status}
            </span>
            {status === 'SUSPEND' && (
                <button onClick={resetRetryCount}>Retry</button>
            )}
        </div>
    )
}
```

## Multiple Hooks

You can use `usePipewave` in multiple components simultaneously. Each component registers its own set of handlers, and all handlers for the same message type will be called:

```tsx
// Component A subscribes to CHAT_INCOMING_MSG
usePipewave(useMemo(() => ({ CHAT_INCOMING_MSG: handleChatA }), []))

// Component B also subscribes to CHAT_INCOMING_MSG
usePipewave(useMemo(() => ({ CHAT_INCOMING_MSG: handleChatB }), []))

// Both handleChatA and handleChatB will fire when a CHAT_INCOMING_MSG arrives
```
