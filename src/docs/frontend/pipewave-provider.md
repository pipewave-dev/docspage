# PipewaveProvider

The `PipewaveProvider` component manages the WebSocket lifecycle and provides connection context to all child components.

## Basic Usage

```tsx
import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/react'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'api.example.com/websocket',
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

    // Enable debug logging (default: false)
    debugMode: process.env.NODE_ENV !== 'production',

    // Async function to retrieve the current access token
    // Called before each connection/reconnection attempt
    getAccessToken: async () => {
        return localStorage.getItem("auth_token") || ""
    },
})
```

## Event Handler

You can optionally provide global event handlers:

```tsx
import type { WebsocketEventHandler } from '@pipewave/react'

const eventHandler: WebsocketEventHandler = {
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onError: (err) => console.error('WS Error:', err),
    onMaxRetry: () => console.warn('Max retries reached, falling back to Long Polling'),
}

<PipewaveProvider config={config} eventHandler={eventHandler}>
    <App />
</PipewaveProvider>
```

## Provider Behavior

- The provider establishes a WebSocket connection on mount
- Automatically handles reconnection with exponential backoff
- Falls back to Long Polling if WebSocket connections fail repeatedly
- Manages heartbeat/keepalive transparently
- The `getAccessToken` function is called before each connection attempt, ensuring fresh tokens
