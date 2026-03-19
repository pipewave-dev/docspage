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
| `getAccessToken` | `() => Promise<string>` | No | — | Async function returning the access token. Called before each connection attempt |
| `enableLongPollingFallback` | `boolean` | No | `true` | Automatically fall back to Long Polling when WebSocket fails |
| `heartbeatInterval` | `number` (ms) | No | `30000` | Heartbeat ping interval |
| `retry` | `RetryConfig` | No | `DEFAULT_RETRY_CONFIG` | Reconnect retry settings |

### DEFAULT_RETRY_CONFIG

```ts
import { DEFAULT_RETRY_CONFIG } from '@pipewave/reactpkg'
// { maxRetry: 3, initialRetryDelay: 1000, maxRetryDelay: 5000 }
```

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
interface WebsocketEventHandler {
    onOpen?: () => Promise<void>
    onClose?: () => Promise<void>
    onError?: (error: Event) => Promise<void>
    onReconnect?: (attempt: number) => Promise<void>
    onTransportChange?: (transport: 'ws' | 'lp') => Promise<void>
    onStatusChange?: (status: string) => Promise<void>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `onOpen` | `async () => void` | Called when WebSocket connection is established |
| `onClose` | `async () => void` | Called when WebSocket connection is closed |
| `onError` | `async (error: Event) => void` | Called when a WebSocket error occurs |
| `onReconnect` | `async (attempt: number) => void` | Called on each reconnect attempt with the attempt number |
| `onTransportChange` | `async (transport: 'ws' \| 'lp') => void` | Called when transport switches between WebSocket and Long Polling |
| `onStatusChange` | `async (status: string) => void` | Called whenever connection status changes |

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
    a?: string     // ACK ID (present only when server requests acknowledgment)
}
```

| Field | Msgpack Tag | Type | Description |
|-------|-------------|------|-------------|
| `i` | `"i"` | `string` | Unique message identifier |
| `t` | `"t"` | `string` | Message type for routing |
| `e` | `"e"` | `Uint8Array` | Error payload (if the server returned an error) |
| `b` | `"b"` | `Uint8Array` | Binary payload — this is what you `decode()` in handlers |
| `a` | `"a"` | `string` | ACK ID — when present, the server expects an acknowledgment response |

> You rarely interact with the frame directly. The SDK extracts the `b` field and passes it as `data` to your `onMessage` handlers, and the `t` field is used to route to the correct handler. The `usePipewaveSendWaitAck` hook handles ACK automatically.

---

## Connection Status Values

| Status | Description |
|--------|-------------|
| `'READY'` | WebSocket connected and ready to send/receive |
| `'RECONNECTING'` | Attempting to reconnect after connection loss |
| `'SUSPEND'` | Max retries exhausted, connection suspended |

### Status-Based UI Pattern

```tsx
const { status, isConnected, isReconnecting, isSuspended } = usePipewaveStatus()

// Disable send button when not ready
<button disabled={!isConnected}>Send</button>

// Show reconnecting indicator
{isReconnecting && <span>Reconnecting...</span>}

// Show retry button when suspended
{isSuspended && <button onClick={resetRetryCount}>Retry</button>}
```

---

## Specialized Hooks

In addition to `usePipewave`, the SDK provides focused single-responsibility hooks. See the [Hooks Reference](/docs/frontend/hooks) for full documentation.

| Hook | Purpose |
|------|---------|
| `usePipewaveStatus` | Connection status with `isConnected`, `isReconnecting`, `isSuspended` |
| `usePipewaveSend` | Send messages without subscribing |
| `usePipewaveMessage` | Subscribe to a single message type |
| `usePipewaveError` | Subscribe to error messages by type |
| `usePipewaveResetConnection` | Manage connection lifecycle and reset |
| `usePipewaveLatestMessage<T>` | Get the most recent decoded message of a type |
| `usePipewaveMessageHistory<T>` | Accumulate message history with a size limit |
| `usePipewaveSendWaitAck` | Send a message and await server acknowledgment |
| `usePipewaveConnectionInfo` | Connection details including active transport |
| `useDebugLogger` | Log all WebSocket events to console |

---

## PipewaveErrorBoundary

React Error Boundary that catches render errors in the component tree.

```tsx
import { PipewaveErrorBoundary } from '@pipewave/reactpkg'

<PipewaveErrorBoundary fallback={<div>Connection error occurred</div>}>
    <MyApp />
</PipewaveErrorBoundary>
```

| Prop | Type | Description |
|------|------|-------------|
| `fallback` | `ReactNode` | UI displayed when an error is caught |
| `children` | `ReactNode` | Protected component subtree |

---

## Schema System

### createPipewaveSchema

Create a centralized, type-safe codec registry for all message types:

```ts
import { createPipewaveSchema } from '@pipewave/reactpkg'

const schema = createPipewaveSchema({
    CHAT_MSG: {
        encode: (msg: ChatMessage) => ChatMessage.encode(msg).finish(),
        decode: (bytes: Uint8Array) => ChatMessage.decode(bytes),
    },
    USER_STATUS: {
        encode: (s: UserStatus) => UserStatus.encode(s).finish(),
        decode: (bytes: Uint8Array) => UserStatus.decode(bytes),
    },
})

// Use with hooks
const latest = usePipewaveLatestMessage('CHAT_MSG', {
    decode: schema.CHAT_MSG.decode,
})
```

### MessageCodec&lt;T&gt;

```ts
interface MessageCodec<T> {
    encode: (data: T) => Uint8Array
    decode: (bytes: Uint8Array) => T
}
```

Centralizes encode/decode definitions to avoid scattering them across the codebase.
