# Hooks Reference

Pipewave provides a set of focused, single-responsibility hooks alongside the original `usePipewave`. Using specialized hooks is recommended for new code — they are easier to compose, test, and maintain.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## Connection

| Hook | Description |
|------|-------------|
| [usePipewaveStatus](/docs/frontend/hooks/use-pipewave-status) | Track connection status with boolean helpers |
| [usePipewaveConnectionInfo](/docs/frontend/hooks/use-pipewave-connection-info) | Get status + active transport (WebSocket / Long Polling) |
| [usePipewaveResetConnection](/docs/frontend/hooks/use-pipewave-reset-connection) | Expose a manual reconnect trigger |

## Sending

| Hook | Description |
|------|-------------|
| [usePipewaveSend](/docs/frontend/hooks/use-pipewave-send) | Send messages without subscribing to responses |
| [usePipewaveSendWaitAck](/docs/frontend/hooks/use-pipewave-send-wait-ack) | Send and wait for server acknowledgment |

## Receiving

| Hook | Description |
|------|-------------|
| [usePipewaveMessage](/docs/frontend/hooks/use-pipewave-message) | Subscribe to incoming messages of a specific type |
| [usePipewaveError](/docs/frontend/hooks/use-pipewave-error) | Subscribe to error messages for a specific type |
| [usePipewaveLatestMessage](/docs/frontend/hooks/use-pipewave-latest-message) | Store and return the most recently received message |
| [usePipewaveMessageHistory](/docs/frontend/hooks/use-pipewave-message-history) | Accumulate a sliding window of received messages |

