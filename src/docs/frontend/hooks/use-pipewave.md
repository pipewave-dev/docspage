# usePipewave Hook

The `usePipewave` hook is the primary interface for interacting with Pipewave in React components.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

> ⚠️ **Discouraged.** Prefer the specialized hooks (`usePipewaveStatus`, `usePipewaveSend`, `usePipewaveMessage`, etc.) over `usePipewave` to reduce coupling and improve code clarity. See the full list at [Hooks Reference](/docs/frontend/hooks).

## Basic Usage

```tsx
import { usePipewave, type OnMessage } from '@pipewave/reactpkg'
import { decode } from '@msgpack/msgpack'

function MyComponent() {
    const { status, send } = usePipewave({
        CHAT_INCOMING_MSG: async (data: Uint8Array, id: string) => {
            const payload = decode(data) as ChatIncomingMsg
            // Handle incoming message
        },
        CHAT_ACK: async (_: Uint8Array, id: string) => {
            // Handle acknowledgment
        },
    })
}
```

## Handler Registration

Handlers are registered as a key-value map where **keys are message type strings** and **values are async handler functions**:

```tsx
type OnMessage = Record<string, (data: Uint8Array, id: string) => Promise<void>>
type OnError   = Record<string, (data: string,    id: string) => Promise<void>>
```


## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Connection status: `'READY'`, `'SUSPEND'`, etc. |
| `send` | `function` | Send a message to the backend |
| `resetRetryCount` | `function` | Reset the retry counter |
| `reconnect` | `function` | Manually trigger a reconnection |

## Sending Messages

Use MessagePack encoding for efficient binary data:

```tsx
import { encode } from '@msgpack/msgpack'

const { send, status } = usePipewave({
    CHAT_INCOMING_MSG: async (data, id) => { /* ... */ },
})

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
    const { status, resetRetryCount } = usePipewave()

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
usePipewave({ CHAT_INCOMING_MSG: handleChatA })

// Component B also subscribes to CHAT_INCOMING_MSG
usePipewave({ CHAT_INCOMING_MSG: handleChatB })

// Both handleChatA and handleChatB will fire when a CHAT_INCOMING_MSG arrives
```

---

## Specialized Hooks

For new code, **prefer the specialized hooks** over `usePipewave`. Each hook targets a single concern, giving you finer-grained control over exactly the behavior you need:

| Hook | What it replaces in `usePipewave` |
|------|----------------------------------|
| `usePipewaveStatus` | `status` field |
| `usePipewaveSend` | `send` function |
| `usePipewaveMessage` | Message handler registration |
| `usePipewaveResetConnection` | `resetRetryCount` function |

See the full [Hooks Reference](/docs/frontend/hooks) for all available hooks.
