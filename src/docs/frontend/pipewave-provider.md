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
})
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

## Provider Behavior

- The provider establishes a WebSocket connection on mount
- Automatically handles reconnection with exponential backoff
- Falls back to Long Polling if WebSocket connections fail repeatedly
- Manages heartbeat/keepalive transparently
- The `getAccessToken` function is called before each connection attempt, ensuring fresh tokens
