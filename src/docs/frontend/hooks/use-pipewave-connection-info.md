# usePipewaveConnectionInfo

Get detailed information about the current connection.

```ts
const { status, transport } = usePipewaveConnectionInfo()
```

| Return | Type | Description |
|--------|------|-------------|
| `status` | `WsStatus` | Current connection status |
| `transport` | `'ws' \| 'lp'` | Active transport: WebSocket or Long Polling |

```tsx
function TransportBadge() {
    const { transport } = usePipewaveConnectionInfo()
    return <span>{transport === 'ws' ? 'WebSocket' : 'Long Polling'}</span>
}
```
