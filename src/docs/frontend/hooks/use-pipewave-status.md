# usePipewaveStatus

Track WebSocket connection status with convenient boolean helpers.

```ts
const { status, isConnected, isReconnecting, isSuspended } = usePipewaveStatus()
```

| Return | Type | Description |
|--------|------|-------------|
| `status` | `WsStatus` | Raw connection status |
| `isConnected` | `boolean` | `true` when `status === WsStatus.READY` |
| `isReconnecting` | `boolean` | `true` when `status === WsStatus.RECONNECTING` |
| `isSuspended` | `boolean` | `true` when `status === WsStatus.SUSPEND` (max retries reached) |

This hook manages the connection lifecycle (connects on mount, disconnects on unmount). Use it when you need to display connection state without subscribing to messages.

```tsx
function ConnectionBadge() {
    const { isConnected, isReconnecting, isSuspended } = usePipewaveStatus()

    if (isReconnecting) return <span className="yellow">Reconnecting…</span>
    if (isSuspended) return <span className="red">Disconnected</span>
    return <span className="green">Connected</span>
}
```
