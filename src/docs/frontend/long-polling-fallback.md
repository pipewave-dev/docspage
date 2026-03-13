# Long Polling Fallback

When WebSocket connections are blocked or fail repeatedly, Pipewave automatically falls back to Long Polling with zero code changes.

## How It Works

1. The frontend attempts a WebSocket connection
2. If the connection fails, it retries with exponential backoff
3. After reaching `onMaxRetry`, it transparently switches to `LongPollingService`
4. The `usePipewave` API continues to work identically — handlers fire the same way
5. The `status` value changes to `'LONG_POLLING'` so you can inform users if needed

## Automatic Batching

To prevent "one HTTP request per message" overhead, the backend batches pending messages:

- If a user has multiple pending messages when the Long Poll request arrives, they are **batched** into a single response
- The response is a binary frame container: `[<msg1>, <msg2>, <msg3>]`
- The frontend `LongPollingService` unpacks the array and dispatches events sequentially

This means Long Polling performance remains excellent even under high message volume.

## Status Indicator

Show users when they're on Long Polling:

```tsx
function ConnectionBanner() {
    const { status } = usePipewave()

    if (status === 'LONG_POLLING') {
        return (
            <div className="bg-blue-500/10 text-blue-400 px-4 py-2 text-sm">
                Using Long Polling mode. Real-time updates may be slightly delayed.
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
