# Module API

The `delivery.ModuleDelivery` interface is the main entry point exposed by Pipewave. It provides access to messaging services, monitoring, health checks, and connection lifecycle hooks.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

## Overview

```go
type ModuleDelivery interface {
    SetFns(fns *configprovider.Fns)

    Mux() *http.ServeMux
    Services() ExportedServices
    Monitoring() business.Monitoring
    MetricsHandler() http.Handler
    IsHealthy() bool
    Shutdown()
}
```

Inside your handler, embed `delivery.ModuleDelivery` to access all capabilities:

```go
type handleMsg struct {
    i delivery.ModuleDelivery
}
```

---

## Services

### Sending

| Method | Description |
|--------|-------------|
| [SendToUser](/docs/backend/module-api/send-to-user) | Send to all sessions of a specific user |
| [SendToSession](/docs/backend/module-api/send-to-session) | Send to a specific session (tab/device) |
| [SendToUsers](/docs/backend/module-api/send-to-users) | Send to multiple users at once |
| [SendToAnonymous](/docs/backend/module-api/send-to-anonymous) | Send to unauthenticated connections |
| [Broadcast](/docs/backend/module-api/broadcast) | Broadcast to all connected clients |
| [SendToSessionWithAck](/docs/backend/module-api/send-to-session-with-ack) | Send to a session and wait for acknowledgment |
| [SendToUserWithAck](/docs/backend/module-api/send-to-user-with-ack) | Send to a user and wait for acknowledgment from any session |

### Connection State

| Method | Description |
|--------|-------------|
| [CheckOnline](/docs/backend/module-api/check-online) | Check if a user has active connections |
| [CheckOnlineMultiple](/docs/backend/module-api/check-online-multiple) | Check online status of multiple users |
| [GetUserSessions](/docs/backend/module-api/get-user-sessions) | Get details of all sessions for a user |

### Connection Control

| Method | Description |
|--------|-------------|
| [PingConnections](/docs/backend/module-api/ping-connections) | Ping all clients and remove dead sessions |
| [DisconnectSession](/docs/backend/module-api/disconnect-session) | Force-disconnect a specific session |
| [DisconnectUser](/docs/backend/module-api/disconnect-user) | Force-disconnect all sessions of a user |

### Lifecycle Hooks

| Method | Description |
|--------|-------------|
| [OnNewRegister](/docs/backend/module-api/on-new-register) | Register callbacks for new connections |
| [OnCloseRegister](/docs/backend/module-api/on-close-register) | Register callbacks for closed connections |

---

## Monitoring

| Method | Description |
|--------|-------------|
| [InsideActiveConnection](/docs/backend/module-api/monitoring#insideactiveconnection) | Connection stats for the current instance |
| [TotalActiveConnection](/docs/backend/module-api/monitoring#totalactiveconnection) | Total authenticated connections across all instances |
| [WorkerPoolStats](/docs/backend/module-api/monitoring#workerpoolstats) | Internal worker pool state |
| [MetricsHandler](/docs/backend/module-api/metrics) | Prometheus-compatible `/metrics` endpoint |

---

## Lifecycle

| Method | Description |
|--------|-------------|
| [IsHealthy](/docs/backend/module-api/is-healthy) | Check if the instance is ready to handle connections |
| [Shutdown](/docs/backend/module-api/shutdown) | Gracefully shut down Pipewave |
