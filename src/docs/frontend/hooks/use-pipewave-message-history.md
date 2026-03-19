# usePipewaveMessageHistory&lt;T&gt;

Accumulate a sliding window of received messages with optional size limit.

```ts
const messages = usePipewaveMessageHistory<ChatMessage>('CHAT_MSG', {
    decode: (bytes) => ChatMessage.decode(bytes),
    maxSize: 50,  // optional, default: 100
})
// messages: Array<{ data: T, id: string, receivedAt: Date }>
```

| Option | Default | Description |
|--------|---------|-------------|
| `decode` | — | Function to decode `Uint8Array` into `T` |
| `maxSize` | `100` | Maximum number of messages to keep (oldest are dropped first) |
