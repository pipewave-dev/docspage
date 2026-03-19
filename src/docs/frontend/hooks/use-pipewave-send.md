# usePipewaveSend

Send messages without subscribing to incoming messages.

```ts
const { send } = usePipewaveSend()
await send({ id: 'uuid', msgType: 'MY_TYPE', data: encodedBytes })
```
