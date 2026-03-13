# Running the Backend

## Step 1: Start Infrastructure (PostgreSQL + Valkey)

Open a terminal at the project root directory, then:

```bash
cd echowave-backend
docker compose up -d
```

This command will start:
- **PostgreSQL** (database) — port `29102`
- **Valkey** (message queue, similar to Redis) — port `29100`

> **What does `-d` mean?** Run in detached mode (background). The terminal won't be occupied by Docker logs.

Verify the services are running:

```bash
docker compose ps
```

Expected output — both services should be in `Up` state:

```
NAME                    STATUS
echowave-backend-valkey-1     Up
echowave-backend-postgres-1   Up
```

> **Note:** The first run will take a few minutes for Docker to download images. Subsequent runs will be faster.

---

## Step 2: Run the Backend Server

Still in the `echowave-backend` directory:

```bash
go run ./playground
```

Expected output:

```
xxx
Starting server on :8080
Worker pool stats: ...
```

The backend is now ready at `http://localhost:8080`.

> **Note:** Keep this terminal window open. The backend will stop if you close the terminal or press `Ctrl+C`.

---

## Understanding the Config File (config.yaml)

The `echowave-backend/config.yaml` file contains the backend configuration. Some important sections:

### Valkey Connection (Message Queue)

```yaml
VALKEY:
  PRIMARY_ADDRESS: "localhost:29100"
  REPLICA_ADDRESS: "localhost:29100"
  PASSWORD: veryStrongP@ssw0rd
  DB_INDEX: 0
```

### PostgreSQL Connection

```yaml
POSTGRES:
  CREATE_TABLES: true        # Auto-create tables on startup
  HOST: localhost
  PORT: 29102
  DB_NAME: postgres
  USER: postgres
  PASSWORD: postgres
  SSL_MODE: disable
  MAX_CONNS: 15
  MIN_CONNS: 1
```

### CORS (allowing frontend connections)

```yaml
CORS:
  ENABLED: true
  REGEX_ORIGINS:
    - ws://localhost:([0-9]+)
    - wss://localhost:([0-9]+)
    - http://localhost:([0-9]+)
    - https://localhost:([0-9]+)
```

> The default configuration allows all connections from `localhost`, suitable for development environments.

---

## Understanding playground/main.go

The `playground/main.go` file is the backend entry point. Here's an explanation of each part:

### 1. App Initialization

```go
appDI := app.NewPipewave(
    config,
    slog.Default(),
    ddbRepo.NewPostgresRepo,       // Use PostgreSQL as database
    queueprovider.QueueValkey,     // Use Valkey as message queue
)
```

You can switch to DynamoDB by changing the import:

```go
// Replace this line:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-postgres"

// With this line:
ddbRepo "git.ponos-tech.com/pipewave/backend/core/repository/impl-dynamodb"
```

> When using DynamoDB, you need to uncomment the `dynamodb-local` section in `docker-compose.yml` and update the config accordingly.

### 2. Token Authentication Function (InspectToken)

```go
InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
    return trimToken(token), false, nil
},
```

This function receives an access token from the client and returns:
- `username`: the user's name
- `IsAnonymous`: whether the user is anonymous
- `err`: error (if any)

**In the playground**, the token is the username itself (for easy testing). In production, you would replace this with JWT verification logic or a call to an auth service.

### 3. Message Handler Function (HandleMessage)

```go
HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
    fmt.Printf("Received message with inputType: %s and data: %s\n", inputType, string(data))
    return "ECHO_RESPONSE",
        fmt.Appendf(nil, "Got [ %s ] at %s", string(data), time.Now().Format(time.TimeOnly)),
        nil
},
```

This function receives a message from the client and returns a response:
- `inputType`: the message type sent by the client (e.g., `"ECHO"`)
- `data`: message content (as bytes)
- Returns `outputType` + `res` → sent back to the client
- If `outputType` is empty `""` → no response is sent to the client

**In the playground**, the server echoes back the message with a timestamp.

### 4. Server Push (sending messages from the server)

```go
ws := appDI.Delivery.Services().Websocket()
go func() {
    for t := range time.Tick(6 * time.Second) {
        ws.SendToUser(context.Background(), testUser, "ECHO_RESPONSE",
            fmt.Appendf(nil, "hello, can you hear me? [%s]", t.Format(time.TimeOnly)))
    }
}()
```

The backend can proactively send messages to any user at any time using `SendToUser(ctx, username, msgType, data)`.

**In the playground**, every 6 seconds the server sends a message to user `"userxxx"`.

---

## Troubleshooting

### "connection refused" when connecting to PostgreSQL or Valkey

```
Cause:    Docker containers haven't finished starting
Solution: Wait a few seconds and try again, or check with: docker compose ps
```

### "port already in use" (port 8080)

```
Cause:    Another application is using port 8080
Solution: Stop that application, or change the port in main.go:
          Addr: ":8081"  (replace 8080 with another port)
```

### "go: module not found" or module download errors

```
Cause:    Dependencies haven't been downloaded
Solution: Run: go mod download
          (in the echowave-backend directory)
```

---

## Stopping the Backend

- Press `Ctrl+C` in the terminal running the backend
- To stop Docker containers:

```bash
docker compose down
```

> **Note:** `docker compose down` will stop PostgreSQL and Valkey. PostgreSQL data is stored in `./tmp/postgres-data` so it won't be lost on restart.

---

## Next

→ [04 - Running the Frontend](./04-frontend.md)
