# Scaling & Deployment

Pipewave is designed for horizontal scalability from the ground up. No sticky sessions, no single point of failure.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg) · Examples: [github.com/pipewave-dev/example](https://github.com/pipewave-dev/example)

## Multi-Instance Architecture

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │ (no sticky)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴──────┐ ┌──┴───────┐
        │Instance 1 │ │Instance 2│ │Instance 3│
        │  Pipewave │ │ Pipewave │ │ Pipewave │
        └─────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴───────┐
                    │   PubSub     │
                    │(Valkey/Redis)│
                    └──────────────┘
```

## Key Points

- **No sticky sessions** — Any instance can handle any connection. The PubSub layer ensures cross-instance delivery
- **Stateless instances** — Connection state is stored in the configured storage adapter (PostgreSQL/DynamoDB)
- **Graceful shutdown** — Call `pw.Shutdown()` to drain connections before pod termination
- **Memory efficiency** — Idle connections consume near-zero memory thanks to kqueue/epoll. A single pod can handle tens of thousands of connections
- **Health checks** — Pipewave provides an `IsHealthy() bool` method that you can integrate into your own health check endpoints for Kubernetes liveness/readiness probes
