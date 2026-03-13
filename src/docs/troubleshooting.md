# Troubleshooting

Common issues and how to resolve them.

## Enable Debug Mode

Before debugging, enable debug logging on both sides:

**Frontend** — Set `debugMode: true` in your config:

```tsx
const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/pipewave',
    debugMode: true,  // Logs connection events, message routing, and errors to console
    // ...
})
```

With debug mode enabled, open your browser's Developer Tools → Console to see:
- Connection attempts and status changes
- Message send/receive events with types
- Reconnection attempts and fallback triggers

**Backend** — Set `Env: "development"` in your config to enable verbose logging:

```go
ConfigStore: configprovider.FromGoStruct(pipewave.ConfigEnv{
    Env: "development",
    // ...
})
```

## Common Issues

### "WebSocket connection failed" / Status stays SUSPEND

**Symptoms:** The frontend never reaches `READY` status, or immediately goes to `SUSPEND`.

**Checklist:**

1. **Is the backend running?**
   ```bash
   curl http://localhost:8080/pipewave/health
   # Should return a 200 response
   ```

2. **Is the endpoint correct?** The `backendEndpoint` should be the host + path **without protocol**:
   ```tsx
   // ✅ Correct
   backendEndpoint: 'localhost:8080/pipewave'

   // ❌ Wrong — don't include ws:// or http://
   backendEndpoint: 'ws://localhost:8080/pipewave'
   ```

3. **Is CORS configured?** Your frontend origin must be allowed:
   ```go
   CORS: pipewave.CORSConfig{
       Enabled:        true,
       ExactlyOrigins: []string{"http://localhost:5173"},
   },
   ```

4. **Are you using `insecure: true` for local development?**
   ```tsx
   const config = new PipewaveModuleConfig({
       insecure: true,  // Use ws:// instead of wss:// for localhost
       // ...
   })
   ```

5. **Is Valkey/Redis running?** Check with:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

6. **Is PostgreSQL running and accessible?**
   ```bash
   psql -h localhost -U pipewave -d pipewave -c "SELECT 1"
   ```

### "I'm not receiving messages"

**Symptoms:** `send()` works (no errors), but the target user's `onMessage` handler never fires.

**Checklist:**

1. **Is the message type matching?** The `msgType` in `send()` must match `inputType` in `HandleMessage`, and the response type must match a key in `onMessage`:
   ```
   Frontend send: msgType = "CHAT_SEND"
        ↓
   Backend HandleMessage: inputType == "CHAT_SEND"
   Backend returns: outputType = "CHAT_INCOMING"
        ↓
   Frontend onMessage: key = "CHAT_INCOMING"  ← must match exactly
   ```

2. **Is the handler memoized?** Without `useMemo`, handlers re-register every render:
   ```tsx
   // ✅ Correct
   const onMessage: OnMessage = useMemo(() => ({
       CHAT_INCOMING: async (data) => { /* ... */ },
   }), [])

   // ❌ Wrong — creates new object every render
   const onMessage: OnMessage = {
       CHAT_INCOMING: async (data) => { /* ... */ },
   }
   ```

3. **Is the target user actually connected?** Use `CheckOnline()` in your handler:
   ```go
   isOnline, err := h.i.Services().CheckOnline(ctx, targetUserID)
   ```

4. **Are you using `SendToUser` correctly?** The first argument is the target user ID (from `InspectToken`), not a connection ID:
   ```go
   // ✅ Correct — sends to the user
   h.i.Services().SendToUser(ctx, "alice", "MSG_TYPE", data)

   // ❌ Wrong — this is not a connection ID
   h.i.Services().SendToUser(ctx, "ws-conn-123", "MSG_TYPE", data)
   ```

5. **Is your `InspectToken` returning the right user ID?** Add logging to verify:
   ```go
   func inspectToken(ctx context.Context, token string) (string, bool, error) {
       userID := extractUserID(token)
       log.Printf("InspectToken: token=%s → userID=%s", token, userID)
       return userID, false, nil
   }
   ```

### "Token validation fails" / Connection keeps reconnecting

**Symptoms:** The connection opens briefly then closes, or you see auth errors in logs.

**Checklist:**

1. **Is `getAccessToken` returning a valid token?**
   ```tsx
   getAccessToken: async () => {
       const token = localStorage.getItem("auth_token")
       console.log("Token being sent:", token)  // Debug
       return token || ""
   }
   ```

2. **Does your `InspectToken` handle the token format?** Test it directly:
   ```go
   // Test with a known token
   userID, isAnon, err := inspectToken(ctx, "your-test-token")
   fmt.Printf("Result: userID=%s, isAnon=%v, err=%v\n", userID, isAnon, err)
   ```

3. **Is the token expired?** The `getAccessToken` function is called before each connection attempt. Make sure it returns a fresh token, not a cached expired one.

### "Messages are arriving but data is garbled"

**Symptoms:** Handler fires but `decode(data)` returns unexpected values or throws an error.

**Checklist:**

1. **Are your Go struct tags correct?** Use `msgpack` tags, not `json`:
   ```go
   // ✅ Correct
   type Payload struct {
       Content string `msgpack:"content"`
   }

   // ❌ Wrong — json tags are ignored by msgpack
   type Payload struct {
       Content string `json:"content"`
   }
   ```

2. **Do TypeScript field names match the `msgpack` tags?**
   ```go
   // Go
   type Msg struct {
       FromUserID string `msgpack:"from_user_id"`
   }
   ```
   ```tsx
   // TypeScript — field names must match the msgpack tags
   const payload = decode(data) as {
       from_user_id: string  // ✅ matches "from_user_id"
   }
   ```

3. **Are you decoding the right data?** The `data` parameter in `onMessage` is the `b` (binary) field from the frame, already extracted. Don't try to decode the entire frame.

### Long Polling fallback is active unexpectedly

**Symptoms:** Status shows `SUSPEND`, connection works but is slower than expected.

**Possible causes:**

- **Corporate firewall** blocking WebSocket `Upgrade` headers
- **Reverse proxy** (Nginx, CloudFlare) not configured for WebSocket
- **VPN** stripping WebSocket connections

**For Nginx**, ensure WebSocket upgrade is configured:
```nginx
location /pipewave/ {
    proxy_pass http://backend:8080/pipewave/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### Performance issues with many connections

**Symptoms:** High memory usage or slow response times under load.

**Tips:**

1. **Tune the worker pool buffer** based on your message throughput:
   ```go
   WorkerPool: pipewave.WorkerPoolConfig{
       Buffer:         512,   // Increase for high throughput
       UpperThreshold: 1000,  // Scale up threshold
       LowerThreshold: 100,   // Scale down threshold
   },
   ```

2. **Enable rate limiting** to prevent abuse:
   ```go
   RateLimiter: pipewave.RateLimiterConfig{
       UserRate:       10,   // messages per second per user
       UserBurst:      20,
       AnonymousRate:  2,
       AnonymousBurst: 5,
   },
   ```

3. **Check connection store performance** — Ensure PostgreSQL has proper indexes and connection pooling configured.

4. **Scale horizontally** — Add more instances behind a load balancer. See [Scaling & Deployment](/docs/backend/scaling).

## Still Stuck?

- Check the [example repository](https://github.com/pipewave-dev/example) for working code
- Review the [Module API](/docs/backend/module-api) for `IsHealthy()` and monitoring tools
- Open an issue on [GitHub](https://github.com/pipewave-dev/go-pkg/issues)
