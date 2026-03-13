# Backend Quick Start

Get Pipewave running in your Go application in under 5 minutes.

## Installation

```bash
go get git.ponos-tech.com/pipewave/backend
```

## Minimal Setup

```go
package main

import (
    app "git.ponos-tech.com/pipewave/backend/app"
    configprovider "git.ponos-tech.com/pipewave/backend/provider/config-provider"
    "context"
    "net/http"
)

func main() {
    config := configprovider.FromYaml(
        []string{".config.yaml"},
        &configprovider.Fns{
            InspectToken: func(ctx context.Context, token string) (string, bool, error) {
                // Return username from token
                return parseToken(token), false, nil
            },
            HandleMessage: func(ctx context.Context, auth Auth, inputType string, data []byte) (string, []byte, error) {
                // Process incoming messages
                return "ECHO", []byte("Received: " + string(data)), nil
            },
        },
    )

    di := app.NewPipewave(config)

    server := &http.Server{
        Addr:    ":8080",
        Handler: di.Delivery.Mux(),
    }
    server.ListenAndServe()
}
```

## Configuration File

Create `.config.yaml` in your project root:

```yaml
server:
  port: 8080
  read_timeout: 30s
  write_timeout: 30s

websocket:
  max_message_size: 65536
  heartbeat_interval: 30s
  handshake_timeout: 10s

pubsub:
  type: valkey
  address: localhost:6379

storage:
  type: dynamodb
  table_name: pipewave_connections
  region: ap-southeast-1
```

## What's Next

- Configure [InspectToken](/docs/backend/inspect-fn) for your auth system
- Implement [HandleMessage](/docs/backend/handler-fn) for your business logic
- Use the [Services API](/docs/backend/services-api) to push messages from your backend
