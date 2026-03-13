# Frontend API Reference

Complete TypeScript API reference for `@pipewave/reactpkg`.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## PipewaveModuleConfig

Configuration object passed to `PipewaveProvider`.

```tsx
import { PipewaveModuleConfig } from '@pipewave/reactpkg'

const config = new PipewaveModuleConfig(options)
```

### Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `backendEndpoint` | `string` | Yes | — | Backend endpoint without protocol (e.g., `"api.example.com/pipewave"`) |
| `insecure` | `boolean` | No | `false` | Use `ws://` instead of `wss://`. Set `true` for local development |
| `debugMode` | `boolean` | No | `false` | Enable debug logging to browser console |
| `getAccessToken` | `() => Promise<string>` | No | — | Async function returning the access token. Called before each connection attempt |

---

## PipewaveProvider

React context provider that manages the WebSocket lifecycle.

```tsx
import { PipewaveProvider } from '@pipewave/reactpkg'
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `PipewaveModuleConfig` | Yes | Connection configuration |
| `eventHandler` | `EventHandler` | No | Global connection event callbacks |
| `children` | `ReactNode` | Yes | Child components |

---

## EventHandler

Global event callbacks for connection lifecycle.

```tsx
interface EventHandler {
    onOpen?: () => Promise<void>
    onClose?: () => Promise<void>
    onError?: (error: Event) => Promise<void>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `onOpen` | `async () => void` | Called when WebSocket connection is established |
| `onClose` | `async () => void` | Called when WebSocket connection is closed |
| `onError` | `async (error: Event) => void` | Called when a WebSocket error occurs |

---

## usePipewave

The primary hook for interacting with Pipewave in React components.

```tsx
import { usePipewave } from '@pipewave/reactpkg'

const { status, send, resetRetryCount } = usePipewave(onMessage)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `onMessage` | `OnMessage` | Memoized map of message type handlers |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Connection status (`'READY'`, `'SUSPEND'`, etc.) |
| `send` | `(params: SendParams) => void` | Send a message to the backend |
| `resetRetryCount` | `() => void` | Reset retry counter and attempt reconnection |

---

## OnMessage

Handler map type for incoming messages. **Must be memoized with `useMemo`.**

```tsx
import { type OnMessage } from '@pipewave/reactpkg'

type OnMessage = Record<string, (data: Uint8Array, messageId: string) => Promise<void>>
```

### Handler Function Signature

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Uint8Array` | Binary payload (the `b` field from the WebSocket frame) |
| `messageId` | `string` | Unique message ID (the `i` field from the WebSocket frame) |

### Example

```tsx
const onMessage: OnMessage = useMemo(() => ({
    CHAT_INCOMING: async (data: Uint8Array, id: string) => {
        const payload = decode(data) as ChatIncomingMsg
        // handle message
    },
    NOTIFICATION: async (data: Uint8Array) => {
        const payload = decode(data) as NotificationPayload
        // handle notification
    },
}), [])
```

---

## SendParams

Parameters for the `send` function.

```tsx
interface SendParams {
    id: string
    msgType: string
    data: Uint8Array
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique message ID. Use `crypto.randomUUID()` |
| `msgType` | `string` | Message type string matching your backend handler (e.g., `"CHAT_SEND"`) |
| `data` | `Uint8Array` | Binary payload. Use `encode()` from `@msgpack/msgpack` |

### Example

```tsx
import { encode } from '@msgpack/msgpack'

send({
    id: crypto.randomUUID(),
    msgType: 'CHAT_SEND',
    data: encode({ to_user_id: 'alice', content: 'Hello!' }),
})
```

---

## WebSocket Frame Structure

The wire format for all WebSocket messages (both directions).

```tsx
interface WebsocketResponse {
    i: string      // Message ID
    t: string      // Message Type
    e: Uint8Array  // Error payload (empty if no error)
    b: Uint8Array  // Binary payload (your data)
}
```

| Field | Msgpack Tag | Type | Description |
|-------|-------------|------|-------------|
| `i` | `"i"` | `string` | Unique message identifier |
| `t` | `"t"` | `string` | Message type for routing |
| `e` | `"e"` | `Uint8Array` | Error payload (if the server returned an error) |
| `b` | `"b"` | `Uint8Array` | Binary payload — this is what you `decode()` in handlers |

> You rarely interact with the frame directly. The SDK extracts the `b` field and passes it as `data` to your `onMessage` handlers, and the `t` field is used to route to the correct handler.

---

## Connection Status Values

| Status | Description |
|--------|-------------|
| `'READY'` | WebSocket connected and ready to send/receive |
| `'SUSPEND'` | Connection lost, using Long Polling fallback or waiting for retry |

### Status-Based UI Pattern

```tsx
const { status, resetRetryCount } = usePipewave(onMessage)

// Disable send button when not ready
<button disabled={status !== 'READY'}>Send</button>

// Show retry button when suspended
{status === 'SUSPEND' && <button onClick={resetRetryCount}>Retry</button>}
```
