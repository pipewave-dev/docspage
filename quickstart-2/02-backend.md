# Backend

## Entry Point (playground/main.go)

```go
appDI := app.NewPipewave(
    config,
    slog.Default(),
    ddbRepo.NewPostgresRepo,         // hoặc NewDynamoDBRepo
    queueprovider.QueueValkey,
)
```

Hai callback chính cần implement:

### InspectToken — Xác thực

Nhận token từ client, trả về `(username, isAnonymous, error)`.

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    // Playground: token = username
    return strings.TrimSpace(token), false, nil
},
```

Production với JWT:

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    claims := jwt.MapClaims{}
    _, err := jwt.ParseWithClaims(
        strings.TrimPrefix(token, "Bearer "),
        claims,
        func(t *jwt.Token) (interface{}, error) {
            return []byte("secret"), nil
        },
    )
    if err != nil {
        return "", false, err
    }
    return claims["sub"].(string), false, nil
},
```

Anonymous user:

```go
InspectToken: func(ctx context.Context, token string) (string, bool, error) {
    if token == "" {
        return "anon-" + uuid.New().String()[:8], true, nil
    }
    return validateToken(token)
},
```

### HandleMessage — Xử lý message

Nhận `(ctx, auth, inputType, data)`, trả về `(outputType, responseData, error)`.

- `inputType`: message type từ client (tương tự route trong REST)
- Trả `outputType` rỗng `""` → không gửi response về client
- `auth.Username`: username đã xác thực từ InspectToken

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
    switch inputType {
    case "CHAT_SEND":
        var msg ChatMessage
        if err := json.Unmarshal(data, &msg); err != nil {
            return "ERROR", []byte("invalid JSON"), nil
        }
        // business logic...
        return "CHAT_NEW", responseBytes, nil

    case "READ_RECEIPT":
        // fire-and-forget, không cần response
        saveReadReceipt(auth.Username, data)
        return "", nil, nil

    default:
        return "", nil, fmt.Errorf("unknown: %s", inputType)
    }
},
```

### Server Push

Gửi message tới user bất kỳ lúc nào (không cần client request):

```go
ws := appDI.Delivery.Services().Websocket()

// Gửi tới 1 user
ws.SendToUser(ctx, "alice", "NOTIFICATION", []byte("new message"))

// Broadcast tới nhiều user
for _, user := range roomUsers {
    ws.SendToUser(ctx, user, "ROOM_MESSAGE", data)
}
```

### Connection Hooks

```go
configprovider.FromYaml([]string{"./config.yaml"}, &configprovider.Fns{
    InspectToken:  myInspectToken,
    HandleMessage: myHandleMessage,
    OnNewConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
        // user connected — update online status, etc.
    },
    OnCloseConnection: func(ctx context.Context, auth voAuth.WebsocketAuth) {
        // user disconnected
    },
})
```

## Config (config.yaml)

```yaml
VALKEY:
  PRIMARY_ADDRESS: "localhost:29100"
  REPLICA_ADDRESS: "localhost:29100"
  PASSWORD: veryStrongP@ssw0rd
  DB_INDEX: 0

POSTGRES:
  CREATE_TABLES: true    # auto-create tables on startup
  HOST: localhost
  PORT: 29102
  DB_NAME: postgres
  USER: postgres
  PASSWORD: postgres
  SSL_MODE: disable
  MAX_CONNS: 15
  MIN_CONNS: 1

CORS:
  ENABLED: true
  REGEX_ORIGINS:
    - "ws://localhost:([0-9]+)"
    - "wss://localhost:([0-9]+)"
    - "http://localhost:([0-9]+)"
    - "https://localhost:([0-9]+)"
```

## Chuyển sang DynamoDB

1. Uncomment `dynamodb-local` trong `docker-compose.yml`
2. Đổi import:

```go
// from:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-postgres"
// to:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-dynamodb"
```

3. Đổi `ddbRepo.NewPostgresRepo` → `ddbRepo.NewDynamoDBRepo`
