# IsHealthy

Check whether the Pipewave instance is fully initialized and ready to handle connections:

```go
if pw.IsHealthy() {
    // Instance is ready
}
```

Useful for Kubernetes readiness probes or health check endpoints:

```go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    if !pw.IsHealthy() {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
})
```
