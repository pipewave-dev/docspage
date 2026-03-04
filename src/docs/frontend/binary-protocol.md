# Binary Protocol (MessagePack)

Pipewave uses binary frames with MessagePack serialization for efficient data transfer.

## Why Binary?

| Aspect | JSON (Text) | MessagePack (Binary) |
|--------|-------------|---------------------|
| Size | Larger (string keys, escaping) | 20-50% smaller |
| Parse Speed | Slower (string parsing) | Faster (binary decoding) |
| Type Safety | Limited (everything is string) | Native types (int, float, bytes) |
| CPU Usage | Higher | Lower |

## Message Frame Structure

Every WebSocket frame follows this schema:

```typescript
interface WebsocketResponse {
    i: string    // Message ID
    t: string    // Message Type
    e: Uint8Array // Error (if any)
    b: Uint8Array // Binary payload
}
```

## Decoding Data in Handlers

The `data` parameter in your handlers is a raw `Uint8Array`. How you decode it depends on what the server sends:

### Simple Text

```tsx
const handlers = useMemo(() => ({
    NOTIFICATION: async (data: Uint8Array) => {
        const text = new TextDecoder().decode(data)
        showNotification(text)
    },
}), [])
```

### JSON Payload

```tsx
const handlers = useMemo(() => ({
    CHAT_MESSAGE: async (data: Uint8Array) => {
        const json = JSON.parse(new TextDecoder().decode(data))
        addMessage(json)
    },
}), [])
```

### MessagePack Payload

For maximum efficiency, use a MessagePack library:

```tsx
import { decode } from '@msgpack/msgpack'

const handlers = useMemo(() => ({
    LIVE_DATA: async (data: Uint8Array) => {
        const payload = decode(data) as LiveDataPayload
        updateDashboard(payload)
    },
}), [])
```

## Sending Binary Data

When sending data via the `send` function, encode your payload to `Uint8Array`:

```tsx
import { encode } from '@msgpack/msgpack'

const sendAction = () => {
    send({
        id: crypto.randomUUID(),
        msgType: 'ACTION',
        data: encode({ actionType: 'click', targetId: 42 }),
    })
}
```
