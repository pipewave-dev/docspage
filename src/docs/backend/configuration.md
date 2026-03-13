# Configuration

Pipewave is configured through a YAML file and a set of function handlers provided at initialization.

## Config File (`.config.yaml`)

```yaml
server:
  port: 8080
  read_timeout: 30s
  write_timeout: 30s

websocket:
  max_message_size: 65536      # Max bytes per message
  heartbeat_interval: 30s       # Heartbeat ping frequency
  handshake_timeout: 10s        # WebSocket upgrade timeout
  write_buffer_size: 4096       # Write buffer (allocated on demand)
  read_buffer_size: 4096        # Read buffer (allocated on demand)

pubsub:
  type: valkey                  # PubSub adapter: valkey, redis
  address: localhost:6379
  password: ""
  db: 0

storage:
  type: dynamodb                # Storage adapter: dynamodb
  table_name: pipewave_connections
  region: ap-southeast-1
```

## ConfigStore Interface

Pipewave uses a `ConfigStore` interface internally. The `configprovider.FromYaml` helper loads the YAML config and merges it with your custom function handlers:

```go
config := configprovider.FromYaml(
    []string{".config.yaml"},    // Config file paths (first found is used)
    &configprovider.Fns{
        InspectToken:  myInspectFn,
        HandleMessage: myHandlerFn,
    },
)
```

## Environment Variables

You can override config values with environment variables:

| Variable | Override |
|----------|---------|
| `ECHOWAVE_PORT` | `server.port` |
| `ECHOWAVE_PUBSUB_ADDRESS` | `pubsub.address` |
| `ECHOWAVE_STORAGE_TABLE` | `storage.table_name` |

## Buffer Optimization

Pipewave uses zero-allocation buffers for idle connections. The `write_buffer_size` and `read_buffer_size` values are only used when a connection actively sends or receives data. This means you can safely hold hundreds of thousands of idle connections without significant memory overhead.
