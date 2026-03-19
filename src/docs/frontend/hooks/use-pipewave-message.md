# usePipewaveMessage

Subscribe to incoming messages of a specific type.

```ts
usePipewaveMessage('CHAT_MSG', async (data: Uint8Array, id: string) => {
    const decoded = decodeChatMsg(data)
    // handle message
})
```

- The handler is stored with `useEffectEvent` — **no need to memoize it**.
- Automatically re-subscribes when `msgType` changes without reconnecting the WebSocket.
- Does not manage connection lifecycle.
