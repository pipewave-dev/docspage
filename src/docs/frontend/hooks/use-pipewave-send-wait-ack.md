# usePipewaveSendWaitAck

Send a message over WebSocket and wait for server-side acknowledgment before continuing.

> **Prefer HTTP for request-response patterns.**
> HTTP is built around request-response and handles timeouts, retries, and error propagation natively. Use `usePipewaveSendWaitAck` only when you specifically need to reuse an existing WebSocket connection — for example, when the action is tightly coupled to real-time events already flowing through that connection. For standalone actions like form submissions, order creation, or API calls, a plain `fetch` (or your HTTP client of choice) is simpler and more reliable.

```ts
const { sendWaitAck } = usePipewaveSendWaitAck(5000) // 5-second timeout

const result = await sendWaitAck({
    id: crypto.randomUUID(),
    msgType: 'CREATE_ORDER',
    data: encodedBytes,
})
// result: { ackOk: boolean, data: Uint8Array | null }
```

| Return field | Description |
|-------------|-------------|
| `ackOk: true` | Server acknowledged before timeout |
| `ackOk: false` | Timeout elapsed or send failed |
| `data` | Payload from the Ack response, or `null` on timeout |

**How it works:**

The backend sends a response with the same `MsgType` and `ReturnToId` equal to the request `Id`. The hook subscribes to the Ack handler **before** sending — preventing a race condition if the response arrives before the subscription is set up.

**When to use this hook instead of HTTP:**

- The action must be sequenced with other real-time WebSocket events (e.g., trigger an action and react to the server's push response in the same flow).
- You need to avoid an extra HTTP round-trip when the WebSocket connection is already open and the latency difference matters.

```tsx
async function placeOrder(order: Order) {
    const { ackOk } = await sendWaitAck({
        id: crypto.randomUUID(),
        msgType: 'PLACE_ORDER',
        data: encode(order),
    })

    if (!ackOk) {
        toast.error('Order confirmation timed out — please try again')
    }
}
```
