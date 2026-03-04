# Frontend Quick Start

Get Pipewave running in your React/TypeScript application.

## Installation

```bash
npm install @pipewave/react
```

## Setup Provider

Wrap your application with `PipewaveProvider`:

```tsx
import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/react'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'api.example.com/websocket',
    insecure: false,
    debugMode: process.env.NODE_ENV !== 'production',
    getAccessToken: async () => {
        return localStorage.getItem("auth_token") || ""
    },
})

export default function App() {
    return (
        <PipewaveProvider config={config}>
            <YourApplication />
        </PipewaveProvider>
    )
}
```

## Use the Hook

In any component, use `usePipewave` to subscribe to events:

```tsx
import { usePipewave } from '@pipewave/react/hooks'
import { useMemo, useState } from 'react'

function ChatRoom() {
    const [messages, setMessages] = useState<string[]>([])

    const handlers = useMemo(() => ({
        CHAT_MESSAGE: async (data: Uint8Array) => {
            const text = new TextDecoder().decode(data)
            setMessages(prev => [...prev, text])
        },
    }), [])

    const { status, send } = usePipewave(handlers)

    return (
        <div>
            <p>Status: {status}</p>
            {messages.map((msg, i) => <p key={i}>{msg}</p>)}
        </div>
    )
}
```

## What's Next

- Learn about [PipewaveProvider](/docs/frontend/pipewave-provider) configuration options
- Deep dive into the [usePipewave Hook](/docs/frontend/use-pipewave-hook)
- Understand the [Binary Protocol](/docs/frontend/binary-protocol) for efficient data transfer
