# HandleMessage Function

The `HandleMessage` function processes incoming WebSocket frames from clients. It's where you implement your business logic for handling multiplexed message types.

> Package: [github.com/pipewave-dev/go-pkg](https://github.com/pipewave-dev/go-pkg) · See also: [examples](https://github.com/pipewave-dev/example)

## Interface

`HandleMessage` is an interface that requires implementing the `HandleMessage` method:

```go
type HandleMessage interface {
    HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error)
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `context.Context` | Request context |
| `auth` | `voAuth.WebsocketAuth` | Authenticated user info (contains `UserID` and optional `Metadata` from `InspectToken`) |
| `inputType` | `string` | The message type identifier sent by the client |
| `data` | `[]byte` | The binary payload (typically MessagePack-encoded) |

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `outputType` | `string` | The response message type sent back to the client. Return `""` for no response |
| `res` | `[]byte` | The response binary payload |
| `err` | `error` | Return an error to send an error frame to the client |

## Creating a Handler

Create a struct that holds a reference to the Pipewave instance, which gives you access to the Services API:

```go
import (
    "github.com/pipewave-dev/go-pkg/core/delivery"
    voAuth "github.com/pipewave-dev/go-pkg/core/domain/value-object/auth"
    "github.com/vmihailenco/msgpack/v5"
)

type handleMsg struct {
    i delivery.ModuleDelivery
}
```

Register it via `SetFns`:

```go
pw := pipewave.NewPipewave(pipewave.PipewaveConfig{...})

pw.SetFns(&pipewave.FunctionStore{
    HandleMessage: &handleMsg{i: pw},
    // ...other functions
})
```

## Example: Echo Server (Simplest)

The simplest handler — echoes back whatever the client sends:

```go
func (h *handleMsg) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
    // Echo: return the same data with a response type
    return "ECHO_RESPONSE", data, nil
}
```

That's it! The client sends any message type with any payload, and the server returns it as `ECHO_RESPONSE`. This is a good starting point to verify your setup works before adding business logic.

To handle specific message types, use a `switch`:

```go
func (h *handleMsg) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
    switch inputType {
    case "PING":
        return "PONG", nil, nil
    case "GREET":
        greeting := fmt.Appendf(nil, "Hello %s!", auth.UserID)
        return "GREETING", greeting, nil
    default:
        return "ECHO_RESPONSE", data, nil
    }
}
```

## Example: Chat Application

```go
const (
    // Client-to-Server message types
    MsgTypeChatSendMsg = "CHAT_SEND_MSG"
    MsgTypeChatTyping  = "CHAT_TYPING"

    // Server-to-Client message types
    MsgTypeChatIncomingMsg = "CHAT_INCOMING_MSG"
    MsgTypeChatUserTyping  = "CHAT_USER_TYPING"
    MsgTypeChatAck         = "CHAT_ACK"
    MsgTypeChatFail        = "CHAT_FAIL"
)

// Payload structs
type ChatSendMsg struct {
    ToUserID string `msgpack:"to_user_id"`
    Content  string `msgpack:"content"`
}

type ChatIncomingMsg struct {
    FromUserID string `msgpack:"from_user_id"`
    Content    string `msgpack:"content"`
    Timestamp  int64  `msgpack:"timestamp"`
}

func (h *handleMsg) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
    switch inputType {
    case MsgTypeChatSendMsg:
        var msg ChatSendMsg
        if err := msgpack.Unmarshal(data, &msg); err != nil {
            return "", nil, nil
        }

        // Check if the target user is online
        isOnline, err := h.i.Services().CheckOnline(ctx, msg.ToUserID)
        if err != nil || !isOnline {
            return MsgTypeChatFail,
                mustMarshal(ChatSendMsgFail{Reason: "User is not online"}), nil
        }

        // Forward message to target user
        err = h.i.Services().SendToUser(ctx, msg.ToUserID, MsgTypeChatIncomingMsg,
            mustMarshal(ChatIncomingMsg{
                FromUserID: auth.UserID,
                Content:    msg.Content,
                Timestamp:  time.Now().Unix(),
            }))
        if err != nil {
            return MsgTypeChatFail,
                mustMarshal(ChatSendMsgFail{Reason: "Failed to send message"}), nil
        }

        // Acknowledge the sender
        return MsgTypeChatAck, mustMarshal(ChatSendMsgAck{Ok: true}), nil

    case MsgTypeChatTyping:
        var typing ChatTyping
        if err := msgpack.Unmarshal(data, &typing); err != nil {
            return "", nil, nil
        }
        h.i.Services().SendToUser(ctx, typing.ToUserID, MsgTypeChatUserTyping,
            mustMarshal(ChatUserTyping{FromUserID: auth.UserID}))
        return "", nil, nil

    default:
        return "ECHO_RESPONSE",
            fmt.Appendf(nil, "Got [ %s ] at %s", string(data), time.Now().Format(time.TimeOnly)),
            nil
    }
}

func mustMarshal(v any) []byte {
    b, err := msgpack.Marshal(v)
    if err != nil {
        panic(err)
    }
    return b
}
```

## Key Points

- The handler receives the `delivery.ModuleDelivery` interface, which gives access to `Services()` for cross-user messaging
- Use `h.i.Services().SendToUser()` to forward messages to other connected users
- Use `h.i.Services().CheckOnline()` to verify if a user is currently connected
- Return `"", nil, nil` when no response should be sent back to the sender (e.g., typing indicators)
- Return a non-nil `error` to send an error frame back to the client. The connection is **not** closed on error
