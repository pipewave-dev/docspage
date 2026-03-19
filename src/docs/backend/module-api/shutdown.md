# Shutdown

Gracefully shut down Pipewave — closes all connections and releases resources:

```go
pw.Shutdown()
```

Call this during your application's graceful shutdown sequence, typically in response to OS signals:

```go
signalChan := make(chan os.Signal, 1)
signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)
<-signalChan

pw.Shutdown()
```
