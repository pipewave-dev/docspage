# Monitoring

`pw.Monitoring()` returns the `Monitoring` interface for observing connection and system state.

## InsideActiveConnection

Get connection stats for **the current instance only** (not other instances behind the load balancer):

```go
summary, aErr := h.i.Monitoring().InsideActiveConnection(ctx)
// summary.AnonymosConnection — number of unauthenticated connections
// summary.UserConnection     — number of authenticated connections
// summary.TotalUser          — number of distinct authenticated users
```

## TotalActiveConnection

Get the **total number of authenticated connections** across **all instances**:

```go
total, aErr := h.i.Monitoring().TotalActiveConnection(ctx)
```

## WorkerPoolStats

Get the current state of the internal worker pool:

```go
stats, aErr := h.i.Monitoring().WorkerPoolStats(ctx)
// stats.Length   — current number of jobs in the pool
// stats.Capacity — maximum capacity of the pool
```

**Example — exposing metrics via an HTTP endpoint:**

```go
http.HandleFunc("/internal/stats", func(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    inside, _ := pw.Monitoring().InsideActiveConnection(ctx)
    total, _  := pw.Monitoring().TotalActiveConnection(ctx)
    pool, _   := pw.Monitoring().WorkerPoolStats(ctx)

    fmt.Fprintf(w, "inside: %s\ntotal: %d\npool: %s\n",
        inside.String(), total, pool.String())
})
```
