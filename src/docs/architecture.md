# Architecture & Performance

This document outlines the design decisions and underlying mechanics that power Pipewave.

## Network & Memory Profile

High-concurrency systems often suffer from memory bloat due to allocating large read/write buffers per connection. If an application holds 100,000 idle WebSocket connections, the memory penalty of standard Go `net/http` handlers becomes unsustainable.

Pipewave solves this with low-level networking paradigms:

- **kqueue / epoll / netpoll** — Instead of dedicating a blocking goroutine per connection, Pipewave parks inactive connections in the OS kernel scheduler
- **Zero Memory Buffers on Idle** — Read/write buffers are only provisioned when a socket fires an active event. This drops baseline memory usage drastically

## Multiplexed Binary Framing

Pipewave transmits payloads exclusively via **Binary Frames** formatted using `msgpack` serialization.

### The Message Protocol

Every frame follows this schema:

```go
type WebsocketResponse struct {
    Id      string      `msgpack:"i"`
    MsgType MessageType `msgpack:"t"`
    Error   []byte      `msgpack:"e"`
    Binary  []byte      `msgpack:"b"`
}
```

By separating `MsgType` from generic `Binary` data:

1. The routing module instantly knows who should handle the payload without parsing the entire body
2. Multiple logical endpoints ("Chat", "Stats", "Notifications") can multiplex over the same socket
3. Errors are handled cleanly via an isolated binary field

## Long Polling Batch Optimization

When environments prevent WebSocket upgrades (strict VPNs, old infrastructure), Pipewave transitions to Long Polling.

To prevent "one HTTP request per message" overhead:

- If a user's pending queue contains multiple messages, the server **batches** them
- Wraps into a single binary frame container: `[<msg1>, <msg2>, <msg3>]`
- The frontend `LongPollingService` intercepts this composite blob, unmarshals the MsgPack array, and dispatches all events sequentially

## Distributed Broadcasting via User ID

Traditional WebSocket management requires "Sticky Sessions" — forcing a user to always route to the same server. Pipewave abstracts the Connection ID entirely, focusing solely on **User ID**.

The architecture is designed to sit alongside a distributed PubSub bus (Redis, Valkey, NATS):

- Pushing an event to User X from Server A triggers a PubSub broadcast
- Server B, which holds the active socket for X, receives and delivers the frame
- No sticky session configuration needed in your load balancer
