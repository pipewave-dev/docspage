# Long Polling Fallback

When WebSocket connections are blocked or fail repeatedly, Pipewave automatically falls back to Long Polling with zero code changes.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## How It Works

1. The frontend attempts a WebSocket connection
2. If the connection fails, it retries with exponential backoff
3. After max retries, it transparently switches to `LongPollingService`
4. The `usePipewave` API continues to work identically — handlers fire the same way
5. The `status` value changes to `'SUSPEND'` so you can inform users and offer a retry button

## Automatic Batching

To prevent "one HTTP request per message" overhead, the backend batches pending messages:

- If a user has multiple pending messages when the Long Poll request arrives, they are **batched** into a single response
- The response is a binary frame container: `[<msg1>, <msg2>, <msg3>]`
- The frontend `LongPollingService` unpacks the array and dispatches events sequentially

This means Long Polling performance remains excellent even under high message volume.

## Status Indicator

Show users when the connection is suspended and offer retry:

```tsx
function ConnectionBanner() {
    const { status, resetRetryCount } = usePipewave(useMemo(() => ({}), []))

    if (status === 'SUSPEND') {
        return (
            <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '8px 16px' }}>
                Connection lost. Real-time updates paused.
                <button onClick={resetRetryCount} style={{ marginLeft: 8 }}>
                    Retry
                </button>
            </div>
        )
    }
    return null
}
```

## When Does Fallback Happen?

Common scenarios where WebSocket connections may be blocked:

- Corporate firewalls / VPNs that block the `Upgrade` header
- Proxy servers that don't support WebSocket passthrough
- Older network infrastructure
- Restrictive Content Security Policies

## Transparent to Your Code

The key design principle is that **your application code doesn't change**. Whether using WebSocket or Long Polling:

- `usePipewave` handlers fire identically
- `send()` works the same way
- Message ordering is preserved
- Binary framing is maintained
