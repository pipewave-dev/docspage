# usePipewaveLatestMessage&lt;T&gt;

Store and return the most recently received message of a given type, with decoding.

```ts
const latest = usePipewaveLatestMessage<ChatMessage>('CHAT_MSG', {
    decode: (bytes) => ChatMessage.decode(bytes),
})
// latest: { data: ChatMessage, id: string, receivedAt: Date } | null
```

| Return field | Type | Description |
|-------------|------|-------------|
| `data` | `T` | Decoded message |
| `id` | `string` | Message ID |
| `receivedAt` | `Date` | Timestamp when the message was received |

Returns `null` before the first message arrives. The `decode` function does not need to be memoized.
