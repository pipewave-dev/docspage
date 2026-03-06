# Backend Quick Start

Get Pipewave running in your Go application in under 5 minutes.

## Installation

> Source code: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

```bash
go get github.com/pipewave-dev/go-pkg
```

## Minimal Setup

```go
package main

import (
    "context"
    "net/http"

    pipewave "github.com/pipewave-dev/go-pkg"
    postgresRepo "github.com/pipewave-dev/go-pkg/core/repository/impl-postgres"
    configprovider "github.com/pipewave-dev/go-pkg/provider/config-provider"
    queueprovider "github.com/pipewave-dev/go-pkg/provider/queue"
)

func main() {
    pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
        ConfigStore:       getConfig(),
        RepositoryFactory: postgresRepo.NewPostgresRepo,
        QueueFactory:      queueprovider.QueueValkey,
    })

    pw.SetFns(&pipewave.FunctionStore{
        InspectToken: func(ctx context.Context, token string) (string, bool, error) {
            return parseToken(token), false, nil
        },
        HandleMessage:     &myHandler{i: pw},
        OnNewConnection:   nil,
        OnCloseConnection: nil,
    })

    server := &http.Server{
        Addr:    ":8080",
        Handler: pw.Mux(),
    }
    server.ListenAndServe()
}
```

## Configuration

You can provide configuration using a Go struct:

```go
func getConfig() configprovider.ConfigStore {
    return configprovider.FromGoStruct(
        pipewave.ConfigEnv{
            Env:     "my-app",
            PodName: "pod-1",
            Version: "0.0.1",
            WorkerPool: configprovider.WorkerPoolT{
                Buffer:         100,
                UpperThreshold: 80,
                LowerThreshold: 20,
            },
            RateLimiter: configprovider.RateLimiterT{
                UserRate:       100,
                UserBurst:      200,
                AnonymousRate:  10,
                AnonymousBurst: 20,
            },
            Cors: configprovider.CorsConfig{
                Enabled:      true,
                RegexOrigins: []string{`^(https?://)?localhost:(\d+)/?$`},
            },
            Valkey: configprovider.ValkeyT{
                PrimaryAddress: "localhost:6379",
                ReplicaAddress: "localhost:6379",
                Password:       "yourPassword",
                DatabaseIdx:    0,
            },
            Postgres: configprovider.PostgresT{
                CreateTables: true,
                Host:         "localhost",
                Port:         5432,
                DBName:       "postgres",
                User:         "postgres",
                Password:     "postgres",
                SSLMode:      "disable",
                MaxConns:     15,
                MinConns:     1,
            },
        },
    )
}
```

## Infrastructure

Pipewave requires **PostgreSQL** (connection state storage) and **Valkey/Redis** (PubSub queue). You can run them with Docker Compose:

```yaml
services:
  valkey:
    image: valkey/valkey:latest
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
```

## What's Next

- Configure [InspectToken](/docs/backend/inspect-fn) for your auth system
- Implement [HandleMessage](/docs/backend/handler-fn) for your business logic
- Use the [Services API](/docs/backend/services-api) to push messages from your backend
- Browse working examples at [github.com/pipewave-dev/example](https://github.com/pipewave-dev/example)
