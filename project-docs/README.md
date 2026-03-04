# Pipewave
**High-Performance WebSocket & Long-Polling Engine**

Pipewave is an advanced real-time communication engine designed for modern web applications. It abstracts away the complexities of WebSocket management, offering a seamless and highly performant module for both Go backends and React/TypeScript frontends.

![Pipewave Real-time communication](https://via.placeholder.com/800x200?text=Pipewave+Engine)

## 🚀 Key Features

*   **Multiplexing Protocol (`Type` + `Data`):** Messages are transmitted as pairs of a string `type` and binary `data`. This allows developers to easily handle various event-driven streams on a single WebSocket connection without the overhead of wrapping everything in heavy JSON payloads.
*   **User-Based Addressing:** Pipewave breaks away from traditional connection-based messaging. You send messages to a `User`, and the module automatically broadcasts them to *all active connections/devices* tied to that user ID.
*   **Built for Extreme Scale:** 
    *   Designed for horizontal scalability across Multi-VMs or Kubernetes.
    *   No sticky sessions required. Built-in broadcast capabilities ensure messages reach the right user anywhere in the cluster.
*   **Unmatched Performance:** 
    *   Optimized data transfer using highly efficient Binary Frames (`msgpack`) rather than uncompressed text.
    *   The Golang backend utilizes kernel `kqueue`/`netpoll` to maintain hundreds of thousands of idle sockets *without consuming significant memory buffers*.
*   **Automatic Fallback & Heartbeat:** 
    *   Frontend modules handles built-in heartbeats—saving developers from writing custom keep-alive logic.
    *   If WebSockets are blocked or dropped, the client seamlessly falls back to a highly-optimized Long Polling mechanism.
*   **First-Class React Support:** The `usePipewave` hook provides an elegant way to manage connection status and register event handlers natively in React components.

## 📚 Documentation Index

Whether you are configuring the backend or wiring up your UI, these guides have you covered:

1. [Backend Integration Guide](./backend-integration.md) - How to attach Pipewave to your Go server, configure handlers, and dispatch messages.
2. [Frontend Integration Guide](./frontend-integration.md) - Setting up the React provider, using hooks, and handling multiplexed data.
3. [Architecture & Performance](./architecture.md) - A deep dive into the underlying architecture, data framing, and memory optimizations.

## 🔭 Future Roadmap
Pipewave is constantly evolving. Expected future developments include:
- Extended Adapter Support for various Databases and PubSub systems.
- Exposing generic APIs for backend integrations beyond Golang.
- Comprehensive Metrics and Dashboards.
