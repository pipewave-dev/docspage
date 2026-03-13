# Binary Protocol (MessagePack)

Pipewave uses binary frames with MessagePack serialization for efficient data transfer.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

> **Note:** You don't need to understand the binary protocol to get started with Pipewave. The SDK handles framing and transport automatically. You just call `encode()` to send and `decode()` to receive — that's it. This page is for developers who want to understand the wire format or implement custom serialization.

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

## Recommended Library

Install `@msgpack/msgpack` for encoding and decoding:

```bash
npm install @msgpack/msgpack
```

```tsx
import { encode, decode } from '@msgpack/msgpack'
```

## Decoding Data in Handlers

The `data` parameter in your handlers is a raw `Uint8Array`. How you decode it depends on what the server sends:

### MessagePack Payload (Recommended)

```tsx
import { decode } from '@msgpack/msgpack'

const onMessage: OnMessage = useMemo(() => ({
    CHAT_INCOMING_MSG: async (data: Uint8Array, id: string) => {
        const payload = decode(data) as {
            from_user_id: string
            content: string
            timestamp: number
        }
        addMessage(payload)
    },
}), [])
```

### Simple Text

If the server sends raw text (e.g., echo responses):

```tsx
const onMessage: OnMessage = useMemo(() => ({
    ECHO_RESPONSE: async (data: Uint8Array) => {
        const text = new TextDecoder().decode(data)
        console.log(text)
    },
}), [])
```

## Sending Binary Data

When sending data via the `send` function, encode your payload with MessagePack:

```tsx
import { encode } from '@msgpack/msgpack'

send({
    id: crypto.randomUUID(),
    msgType: 'CHAT_SEND_MSG',
    data: encode({
        to_user_id: 'user_123',
        content: 'Hello world',
    }),
})
```

## Defining Payload Types

Define TypeScript interfaces that match your backend structs:

```tsx
// Matches Go struct with `msgpack:"..."` tags
interface ChatSendMsg {
    to_user_id: string
    content: string
}

interface ChatIncomingMsg {
    from_user_id: string
    content: string
    timestamp: number
}

// Use in handlers
const payload = decode(data) as ChatIncomingMsg
```
