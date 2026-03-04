# Running the Frontend

The frontend module (`echowave-femodule`) is a React library that provides a ready-made Provider and Hook for connecting to the backend. It also includes an Example page for immediate testing.

---

## Step 1: Install Dependencies

Open a **new terminal** (keep the backend terminal running), then:

```bash
cd echowave-femodule
npm install
```

> The **first run** will download many packages, taking about 1-2 minutes.

---

## Step 2: Run the Development Server

```bash
npm run dev
```

Expected output:

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open your browser at **http://localhost:5173/** to see the Example page.

---

## Step 3: Test WebSocket Communication

On the Example page, you will see:

1. **Access Token input**: Enter a token (which is the username). Default is `"default"`.
2. **Status**: WebSocket connection status (CONNECTING → READY).
3. **Text input + Send button**: Send a message to the backend.
4. **Received Messages**: Displays messages received from the backend.

### Try it out:

1. Wait for the Status to change to **READY**
2. Type `hello` in the input field, click **Send** (or press Enter)
3. You should see a response message appear in the "Received Messages" section, for example:
   ```
   Got [ hello ] at 15:30:45
   ```

### Test server push:

1. Enter `userxxx` in the Access Token field, click **Reconnect**
2. Every 6 seconds, you will receive an automatic message from the server:
   ```
   hello, can you hear me? [15:30:48]
   ```
   (Because in the playground, the backend sends a message to user `"userxxx"` every 6 seconds)

---

## Understanding the Example Code (src/pages/Example.tsx)

### 1. Connection Configuration

```tsx
const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/websocket',  // Backend address
    insecure: true,                                // true = use ws:// (no SSL)
    debugMode: true,                               // Show debug logs
    getAccessToken: async () => accessToken.value,  // Function to get access token
})
```

| Property | Description |
|----------|-------------|
| `backendEndpoint` | Backend address (no need for `ws://` or `http://`) |
| `insecure` | `true` = use `ws://` and `http://`, `false` = use `wss://` and `https://` |
| `debugMode` | `true` = detailed logging to console |
| `getAccessToken` | Async function that returns the access token. The backend uses this token to authenticate the user |

### 2. Wrap the App with PipewaveProvider

```tsx
export default function ExamplePage() {
    return (
        <PipewaveProvider config={config} eventHandler={eventHandler}>
            <Chat />
        </PipewaveProvider>
    )
}
```

`PipewaveProvider` must wrap the entire component tree that needs WebSocket access. Similar to a React Context Provider.

> **Important:** `config` and `eventHandler` must have a **stable reference** (declared outside the component or using `useMemo`). If created inline during render, the WebSocket will reconnect continuously.

### 3. Using the usePipewave Hook

```tsx
function Chat() {
    // Define handlers for each message type
    const onMessage: OnMessage = useMemo(() => ({
        'ECHO_RESPONSE': async (data: Uint8Array, id: string) => {
            const text = decoder.decode(data)
            setMessages(prev => [...prev, { id, text }])
        },
    }), [])

    // Get APIs from the hook
    const { status, send, resetRetryCount } = usePipewave(onMessage)

    // Send a message
    const handleSend = () => {
        send({
            id: crypto.randomUUID(),          // Unique message ID
            msgType: 'ECHO',                   // Message type (backend uses this for routing)
            data: encoder.encode(input),       // Content (must be Uint8Array)
        })
    }
}
```

### usePipewave Hook Details

```tsx
const { status, send, resetRetryCount, reconnect } = usePipewave(onMessage)
```

| Value | Type | Description |
|-------|------|-------------|
| `status` | `string` | Connection status: `"CONNECTING"`, `"READY"`, `"CLOSED"`, `"SUSPEND"` |
| `send` | `function` | Send a message. Takes `{ id, msgType, data }` |
| `resetRetryCount` | `function` | Reset the retry counter when in SUSPEND state |
| `reconnect` | `function` | Disconnect and reconnect |

### Connection Status

```
CONNECTING → READY → (if connection lost) → CONNECTING → READY
                                          → (if max retries reached) → SUSPEND
```

| Status | Meaning |
|--------|---------|
| `CONNECTING` | Connecting to the backend |
| `READY` | Connected, ready to send/receive messages |
| `CLOSED` | Disconnected |
| `SUSPEND` | Maximum retry attempts reached, will not auto-reconnect. Call `resetRetryCount()` to try again |

### 4. Message Data Format

Messages sent and received are in **Uint8Array** (byte array) format. You need to encode/decode manually:

```tsx
// Encode: string → Uint8Array (when sending)
const encoder = new TextEncoder()
const data = encoder.encode("hello world")

// Decode: Uint8Array → string (when receiving)
const decoder = new TextDecoder()
const text = decoder.decode(data)
```

> **Why Uint8Array?** To support sending any type of data (JSON, binary, protobuf...), not limited to text. If you want to send JSON:
>
> ```tsx
> // Send
> const data = encoder.encode(JSON.stringify({ name: "Alice", age: 25 }))
>
> // Receive
> const obj = JSON.parse(decoder.decode(data))
> ```

---

## Long Polling Fallback

EchoWave automatically switches from WebSocket to Long Polling if WebSocket is unavailable (e.g., blocked by a firewall).

- This behavior is enabled by default via `enableLongPollingFallback: true` in the Provider
- The transport that has been proven to work is saved to `sessionStorage` to avoid retrying
- You can **force Long Polling** for testing by setting localStorage in the browser console:

```javascript
localStorage.setItem('FORCE_LONG_POLLING', 'true')
```

Remove it to switch back to WebSocket:

```javascript
localStorage.removeItem('FORCE_LONG_POLLING')
```

---

## Troubleshooting

### Status stays at CONNECTING, never changes to READY

```
Cause:   Backend is not running, or wrong endpoint
Check:
  1. Is the backend running? (terminal shows "Starting server on :8080")
  2. Is backendEndpoint set to 'localhost:8080/websocket'?
  3. Open browser DevTools → Console to see detailed errors
```

### "Access-Control-Allow-Origin" error in Console

```
Cause:    CORS is not configured
Solution: Check the CORS section in config.yaml to ensure the frontend origin is allowed
          (localhost:* is allowed by default)
```

### npm install fails

```
Cause:    Node.js version is too old
Solution: Update Node.js to version 18 or higher
```

---

## Next

→ [05 - How It Works](./05-how-it-works.md)
