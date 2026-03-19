# MetricsHandler

`pw.MetricsHandler()` returns an `http.Handler` that exposes a Prometheus-compatible `/metrics` endpoint using **OpenTelemetry SDK**.

> **Note:** This feature is a work in progress.

## Setup

```go
mux := http.NewServeMux()
mux.Handle("/metrics", pw.MetricsHandler())
http.ListenAndServe(":9090", mux)
```

Or mount alongside your main mux:

```go
mux := pw.Mux()
mux.Handle("/metrics", pw.MetricsHandler())
```

## Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `pipewave_active_connections` | Gauge | `type` (user/anonymous) | Current number of active connections |
| `pipewave_messages_sent_total` | Counter | `target` (session/user/broadcast) | Total messages sent |
| `pipewave_messages_received_total` | Counter | — | Total messages received from clients |
| `pipewave_connection_duration_seconds` | Histogram | `type` (user/anonymous) | Connection lifetime distribution |
| `pipewave_pubsub_messages_total` | Counter | — | Total pub/sub messages published |

The exporter is compatible with both Prometheus scrapers and OpenTelemetry collectors.

**Required dependencies (go.mod):**

```
github.com/prometheus/client_golang
go.opentelemetry.io/otel/exporters/prometheus
go.opentelemetry.io/otel/sdk/metric
```
