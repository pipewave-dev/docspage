# usePipewaveResetConnection

Expose a manual reconnect trigger.

```ts
const { resetRetryCount } = usePipewaveResetConnection()

// Reset the retry counter and attempt to reconnect
resetRetryCount()
```

Useful for admin panels or debug UIs that need a manual "Reconnect" button.
