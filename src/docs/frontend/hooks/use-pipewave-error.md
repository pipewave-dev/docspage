# usePipewaveError

Subscribe to error messages for a specific message type.

```ts
usePipewaveError('CHAT_MSG', async (error: string, id: string) => {
    console.error('Backend error:', error)
})
```

- Handler does not need to be memoized.
