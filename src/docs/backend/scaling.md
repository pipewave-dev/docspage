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

## Kubernetes Deployment

Pipewave works naturally in Kubernetes without any special configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pipewave
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pipewave
  template:
    metadata:
      labels:
        app: pipewave
    spec:
      containers:
        - name: pipewave
          image: your-registry/your-app:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: pipewave
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
  selector:
    app: pipewave
```

## Key Points

- **No sticky sessions** — Any instance can handle any connection. The PubSub layer ensures cross-instance delivery
- **Stateless instances** — Connection state is stored in the configured storage adapter (PostgreSQL/DynamoDB)
- **Graceful shutdown** — Call `pw.Shutdown()` to drain connections before pod termination
- **Memory efficiency** — Idle connections consume near-zero memory thanks to kqueue/epoll. A single pod can handle tens of thousands of connections
- **Health checks** — Pipewave provides an `IsHealthy() bool` method that you can integrate into your own health check endpoints for Kubernetes liveness/readiness probes
