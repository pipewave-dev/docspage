# Configuration

Pipewave is configured through a `ConfigStore` interface. You can provide configuration using a Go struct or load from YAML.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg)

## Using Go Struct

The `configprovider.FromGoStruct` helper creates a `ConfigStore` from a `pipewave.ConfigEnv` struct. This is useful when you want to hardcode or dynamically build configuration:

```go
import (
    pipewave "github.com/pipewave-dev/go-pkg"
    configprovider "github.com/pipewave-dev/go-pkg/provider/config-provider"
)

config := configprovider.FromGoStruct(pipewave.ConfigEnv{
    Env:     "production",
    PodName: "pod-1",

    WorkerPool: configprovider.WorkerPoolT{
        Buffer:         100,   // Worker pool buffer size
        UpperThreshold: 80,    // Scale up threshold
        LowerThreshold: 20,    // Scale down threshold
    },

    RateLimiter: configprovider.RateLimiterT{
        UserRate:       100,   // Requests per second for authenticated users
        UserBurst:      200,   // Burst limit for authenticated users
        AnonymousRate:  10,    // Requests per second for anonymous connections
        AnonymousBurst: 20,    // Burst limit for anonymous connections
    },

    TimeLocation:  time.UTC,
    TraceIDHeader: "X-Trace-ID",
    IpHeader:      "X-Real-IP",

    Cors: configprovider.CorsConfig{
        Enabled:        true,
        ExactlyOrigins: []string{},
        RegexOrigins:   []string{`^(https?://)?localhost:(\d+)/?$`},
    },

    Otel: configprovider.OtelT{
        Enabled: false,
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
})
```

## Configuration Fields

### General

| Field | Type | Description |
|-------|------|-------------|
| `Env` | `string` | Environment name (e.g., "production", "staging") |
| `PodName` | `string` | Instance/pod identifier |
| `Version` | `string` | Application version |
| `TimeLocation` | `*time.Location` | Time zone for timestamps |
| `TraceIDHeader` | `string` | HTTP header for trace ID propagation |
| `IpHeader` | `string` | HTTP header for real client IP (behind proxy) |

### WorkerPool

Controls the internal worker pool for processing messages:

| Field | Type | Description |
|-------|------|-------------|
| `Buffer` | `int` | Worker pool buffer size |
| `UpperThreshold` | `int` | Scale-up threshold percentage |
| `LowerThreshold` | `int` | Scale-down threshold percentage |

### RateLimiter

Per-connection rate limiting:

| Field | Type | Description |
|-------|------|-------------|
| `UserRate` | `int` | Max requests/second for authenticated users |
| `UserBurst` | `int` | Burst limit for authenticated users |
| `AnonymousRate` | `int` | Max requests/second for anonymous connections |
| `AnonymousBurst` | `int` | Burst limit for anonymous connections |

### CORS

| Field | Type | Description |
|-------|------|-------------|
| `Enabled` | `bool` | Enable CORS support |
| `ExactlyOrigins` | `[]string` | Exact origin strings to allow |
| `RegexOrigins` | `[]string` | Regex patterns for allowed origins |

### Valkey (PubSub Queue)

| Field | Type | Description |
|-------|------|-------------|
| `PrimaryAddress` | `string` | Primary Valkey/Redis address |
| `ReplicaAddress` | `string` | Replica address for read operations |
| `Password` | `string` | Authentication password |
| `DatabaseIdx` | `int` | Database index |

### Postgres (Repository)

| Field | Type | Description |
|-------|------|-------------|
| `CreateTables` | `bool` | Auto-create tables on startup |
| `Host` | `string` | Database host |
| `Port` | `int` | Database port |
| `DBName` | `string` | Database name |
| `User` | `string` | Database user |
| `Password` | `string` | Database password |
| `SSLMode` | `string` | SSL mode (e.g., "disable", "require") |
| `MaxConns` | `int` | Maximum connection pool size |
| `MinConns` | `int` | Minimum connection pool size |

## Buffer Optimization

Pipewave uses zero-allocation buffers for idle connections. Read/write buffers are only provisioned when a connection actively sends or receives data. This means you can safely hold hundreds of thousands of idle connections without significant memory overhead.
