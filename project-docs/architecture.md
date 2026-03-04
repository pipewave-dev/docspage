# Architecture & Philosophy

This document outlines the design decisions and underlying mechanics that power Pipewave's performance.

## 1. Network & Memory Profile

High-concurrency systems often suffer from memory bloat due to allocating large read/write buffers per connection. If an application holds 100,000 idle websocket connections (which occasionally receive a small notification), the memory penalty of standard Go `net/http` handlers can become unsustainable.

Pipewave solves this utilizing low-level networking paradigms:
*   **kqueue / epoll / netpoll:** Instead of dedicating a "blocking Goroutine" to monitor every connection, Pipewave parks inactive connections inside the OS kernel scheduler. 
*   **Zero Memory Buffers on Idle:** Memory for read/write buffers is only provisioned when a socket fires an active read/write event. This drops baseline memory usage drastically, ensuring maximum density per Kubernetes Pod or virtual machine.

## 2. Multiplexed Binary Framing 

While `Text` frames and JSON stringification are developer-friendly, they add massive CPU and bandwidth overhead at scale.

Pipewave transmits payloads exclusively via **Binary Frames** formatted using `msgpack` serialization.

### The Message Protocol

Every frame traversing the wire respects the following schema:

```go
type WebsocketResponse struct {
	Id      string      `msgpack:"i"`
	MsgType MessageType `msgpack:"t"`
	Error   []byte      `msgpack:"e"`
	Binary  []byte      `msgpack:"b"`
}
```

By separating `MsgType` from the generic `Binary` data:
1. The routing module instantly knows who should handle the payload without parsing the entire entity body.
2. Multiple distinct logical endpoints ("Chat", "Live Stats", "Notifications") can multiplex safely over the exact same socket connection.
3. Errors are handled cleanly via an isolated binary field.

## 3. Long-Polling Batch Optimization

When environments prevent WebSocket upgrades (strict VPNs, old infrastructure) Pipewave smoothly transitions to Long-Polling.

To prevent the performance disaster of "one HTTP request per message", the backend long-polling system implements queue extraction:
* If a User's pending queue contains more than one message, the server batches them.
* It wraps them into a single binary frame container: `[ <msg1>, <msg2>, <msg3> ]`.
* The frontend `LongPollingService` intercepts this composite binary blob, unmarshals the MsgPack array, and rapidly dispatches all events sequentially to the React views.

## 4. Distributed Broadcasting via User ID

Traditional websocket management requires complex load balancers with "Sticky Sessions", forcing a specific User to always route to Server A where their connection is stored.

Pipewave abstracts the `Connection ID` entirely, focusing solely on the `User ID`. While the current system leverages internal publisher pools, the architecture is inherently designed to sit alongside a distributed PubSub bus (e.g. Redis, Valkey, NATS). Pushing an event to User ID X from Server A will trigger an internal mesh broadcast, delivering the frame via Server B, which currently holds the active socket for X.
