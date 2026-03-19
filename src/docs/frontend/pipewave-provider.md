# PipewaveProvider

The `PipewaveProvider` component manages the WebSocket lifecycle and provides connection context to all child components.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## Basic Usage

```tsx
import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/reactpkg'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',
    insecure: true,
    getAccessToken: async () => getToken(),
})

function App() {
    return (
        <PipewaveProvider config={config}>
            <YourApp />
        </PipewaveProvider>
    )
}
```

## Configuration Options

```tsx
const config = new PipewaveModuleConfig({
    // Required: Your backend WebSocket endpoint (without protocol)
    backendEndpoint: 'api.example.com/websocket',

    // Use ws:// instead of wss:// (default: false)
    insecure: false,

    // Async function to retrieve the current access token
    // Called before each connection/reconnection attempt
    getAccessToken: async () => {
        return localStorage.getItem("auth_token") || ""
    },

    // Automatically fall back to Long Polling when WebSocket fails (default: true)
    enableLongPollingFallback: true,

    // Heartbeat interval in milliseconds (default: 30000)
    heartbeatInterval: 30000,

    // Retry configuration
    retry: {
        maxRetry: 3,
        initialRetryDelay: 1000,
        maxRetryDelay: 5000,
    },
})
```

### All Config Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `backendEndpoint` | `string` | Yes | — | Backend endpoint without protocol |
| `insecure` | `boolean` | No | `false` | Use `ws://` instead of `wss://` |
| `getAccessToken` | `() => Promise<string>` | No | — | Async function returning the access token |
| `enableLongPollingFallback` | `boolean` | No | `true` | Fall back to Long Polling when WebSocket fails |
| `heartbeatInterval` | `number` (ms) | No | `30000` | Heartbeat ping interval |
| `retry` | `RetryConfig` | No | see below | Reconnect retry configuration |

### DEFAULT_RETRY_CONFIG

The default retry configuration is exported for convenience:

```ts
import { DEFAULT_RETRY_CONFIG } from '@pipewave/reactpkg'
// { maxRetry: 3, initialRetryDelay: 1000, maxRetryDelay: 5000 }

// Extend with overrides:
retry: { ...DEFAULT_RETRY_CONFIG, maxRetry: 10 }
```

## Event Handler

You can optionally provide global event handlers via the `eventHandler` prop:

```tsx
const eventHandler = {
    onOpen: async () => {
        console.log('WebSocket connected')
    },
    onClose: async () => {
        console.log('WebSocket disconnected')
    },
    onError: async (error: Event) => {
        console.error('WebSocket error:', error)
    },
    onReconnect: async (attempt: number) => {
        console.log(`Reconnect attempt #${attempt}`)
    },
    onTransportChange: async (transport: 'ws' | 'lp') => {
        console.log(`Transport switched to: ${transport}`)
    },
    onStatusChange: async (status: string) => {
        console.log(`Status changed to: ${status}`)
    },
}

<PipewaveProvider config={config} eventHandler={eventHandler}>
    <App />
</PipewaveProvider>
```

### Event Handler Properties

| Property | Type | Description |
|----------|------|-------------|
| `onOpen` | `async () => void` | Called when WebSocket connection is established |
| `onClose` | `async () => void` | Called when WebSocket connection is closed |
| `onError` | `async (error: Event) => void` | Called when a WebSocket error occurs |
| `onReconnect` | `async (attempt: number) => void` | Called on each reconnect attempt, with the attempt number |
| `onTransportChange` | `async (transport: 'ws' \| 'lp') => void` | Called when the active transport switches between WebSocket and Long Polling |
| `onStatusChange` | `async (status: string) => void` | Called whenever the connection status changes |

## Provider Behavior

- The provider establishes a WebSocket connection on mount
- Automatically handles reconnection with exponential backoff
- Falls back to Long Polling if WebSocket connections fail repeatedly (when `enableLongPollingFallback` is enabled)
- Manages heartbeat/keepalive transparently based on `heartbeatInterval`
- The `getAccessToken` function is called before each connection attempt, ensuring fresh tokens
- A 3-second grace period prevents unnecessary disconnect/reconnect cycles during React re-renders
