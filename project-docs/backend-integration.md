# Pipewave Backend Integration

The Pipewave backend module is designed to drop seamlessly into existing Go applications. It provides the core HTTP multiplexer interfaces, connection lifecycle management, and user-targeted message broadcasting.

## 1. The Core Module Interface

Pipewave provides a modular interface located at `core/delivery/module.go`:

```go
type ModuleDelivery interface {
	Mux() *http.ServeMux

	// Services provides access to Pipewave functionalities without permission checks.
	// Ensure these aren't publicly exposed without proper wrapping.
	Services() GetServices

	// Shutdown call to gracefully shutdown server
	Shutdown()
}
```

By requesting the `Mux()` from the `ModuleDelivery`, you can attach the powerful Pipewave handler directly into your existing HTTP server (e.g., standard `net/http`, Gin, Echo, etc.).

## 2. Initialization and Configuration

Pipewave uses a `ConfigStore` interface, heavily relying on custom functions to integrate with your app's specific authentication logic and business rules.

```go
import (
	app "git.ponos-tech.com/pipewave/backend/app"
	configprovider "git.ponos-tech.com/pipewave/backend/provider/config-provider"
	"context"
)

// Initialize the configuration
config := configprovider.FromYaml(
    []string{".config.yaml"},
    &configprovider.Fns{
        // 1. InspectToken: Your logic to parse a token and return a Username
        InspectToken: func(ctx context.Context, token string) (username string, IsAnonymous bool, err error) {
            return trimToken(token), false, nil
        },

        // 2. HandleMessage: Your business logic for processing incoming WS frames
        HandleMessage: func(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error) {
            // Echo back an example response
            return "ECHO_RESPONSE", []byte("Acknowledged: " + string(data)), nil
        },
    },
)

// Bootstrap the DI container
appDI := app.NewPipewave(config)

// Attach to standard server
server := &http.Server{
    Addr:    ":8080",
    Handler: appDI.Delivery.Mux(),
}
server.ListenAndServe()
```

### Contextual Handlers
- **`InspectToken`**: Called when the client initiates a WebSocket upgrade or long-polling request. Returning a `username` permanently ties that connection/session to the user.
- **`HandleMessage`**: Called whenever the client pushes binary data with a string `inputType` identifier. It cleanly returns the outgoing response type and binary payload, handling the network transmission asynchronously.

## 3. Broadcasting to Users

Unlike raw `gorilla/websocket` where you maintain maps of `map[ConnectionID]*Conn`, Pipewave operates purely on **User Identities**.

```go
ws := appDI.Delivery.Services().Websocket()

func NotifyUser(ctx context.Context, userID, eventType string, payload []byte) {
    // Pipewave automatically finds all active connections (Web, Mobile app, etc.)
    // across your entire cluster and pushes the payload simultaneously.
    ws.SendToUser(ctx, userID, eventType, payload)
}
```

This abstraction allows developers to build user-centric features (like notifications) without worrying about connection drops, multiple devices, or which pod in Kubernetes is holding the socket.
