# Frontend Quick Start

Get Pipewave running in your React/TypeScript application.

## Installation

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

```bash
npm install @pipewave/reactpkg @msgpack/msgpack
```

## Setup Provider

Wrap your application with `PipewaveProvider`:

```tsx
import { PipewaveProvider, PipewaveModuleConfig, PipewaveDebugger } from '@pipewave/reactpkg'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',
    insecure: true,
    getAccessToken: async () => {
        return localStorage.getItem("auth_token") || ""
    },
})

const eventHandler = {
    onOpen: async () => console.log('WebSocket connected'),
    onClose: async () => console.log('WebSocket disconnected'),
    onError: async (error: Event) => console.log('WebSocket error', error),
}

export default function App() {
    return (
        <PipewaveProvider config={config} eventHandler={eventHandler}>
            <YourApplication />
            {import.meta.env.DEV && <PipewaveDebugger />}
        </PipewaveProvider>
    )
}
```

> **Tip:** `PipewaveDebugger` is a visual WebSocket debugging panel — recommended for development environments only. It renders a floating badge (bottom-left) that opens a real-time event log. See [PipewaveDebugger](/docs/frontend/pipewave-debugger) for details.

## Use the Hooks

In any component, use the specialized hooks to subscribe to events and send messages:

```tsx
import {
    usePipewaveMessage,
    usePipewaveSend,
    usePipewaveStatus,
    usePipewaveResetConnection,
} from '@pipewave/reactpkg'
import { encode, decode } from '@msgpack/msgpack'
import { useState } from 'react'

function ChatRoom() {
    const [messages, setMessages] = useState<string[]>([])

    usePipewaveMessage('CHAT_INCOMING_MSG', async (data: Uint8Array) => {
        const payload = decode(data) as { from_user_id: string; content: string }
        setMessages(prev => [...prev, `${payload.from_user_id}: ${payload.content}`])
    })

    const { send } = usePipewaveSend()
    const { status, isSuspended } = usePipewaveStatus()
    const { resetRetryCount } = usePipewaveResetConnection()

    const sendMessage = (content: string, toUserId: string) => {
        send({
            id: crypto.randomUUID(),
            msgType: 'CHAT_SEND_MSG',
            data: encode({ to_user_id: toUserId, content }),
        })
    }

    return (
        <div>
            <p>Status: <span style={{ color: status === 'READY' ? 'green' : 'red' }}>{status}</span></p>
            {isSuspended && <button onClick={resetRetryCount}>Retry</button>}
            {messages.map((msg, i) => <p key={i}>{msg}</p>)}
        </div>
    )
}
```

> **Tip:** `usePipewaveMessage` stores the handler with `useEffectEvent` internally — no need to wrap it in `useMemo` or `useCallback`.

## What's Next

- Learn about [PipewaveProvider](/docs/frontend/pipewave-provider) configuration options
- Deep dive into the [usePipewave Hook](/docs/frontend/hooks/use-pipewave)
- Understand the [Binary Protocol](/docs/frontend/binary-protocol) for efficient data transfer
- Browse working examples at [github.com/pipewave-dev/example](https://github.com/pipewave-dev/example)
