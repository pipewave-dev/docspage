# HandleMessage Function

The `HandleMessage` function processes incoming WebSocket frames from clients. It's where you implement your business logic for handling multiplexed message types.

## Signature

```go
HandleMessage: func(ctx context.Context, auth WebsocketAuth, inputType string, data []byte) (outputType string, res []byte, err error)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `context.Context` | Request context |
| `auth` | `WebsocketAuth` | Authenticated user info from `InspectToken` |
| `inputType` | `string` | The message type identifier sent by the client |
| `data` | `[]byte` | The binary payload (typically MessagePack-encoded) |

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `outputType` | `string` | The response message type sent back to the client |
| `res` | `[]byte` | The response binary payload |
| `err` | `error` | Return an error to send an error frame to the client |

## Example: Multi-Type Handler

```go
HandleMessage: func(ctx context.Context, auth WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
    switch inputType {
    case "CHAT_SEND":
        return handleChatSend(ctx, auth, data)
    case "TYPING_INDICATOR":
        return handleTyping(ctx, auth, data)
    case "READ_RECEIPT":
        return handleReadReceipt(ctx, auth, data)
    default:
        return "ERROR", []byte("unknown message type: " + inputType), nil
    }
},
```

## Working with MessagePack

Since Pipewave uses binary framing, you'll typically decode the `data` parameter using MessagePack:

```go
import "github.com/vmihailenco/msgpack/v5"

type ChatMessage struct {
    RoomID  string `msgpack:"room_id"`
    Content string `msgpack:"content"`
}

func handleChatSend(ctx context.Context, auth WebsocketAuth, data []byte) (string, []byte, error) {
    var msg ChatMessage
    if err := msgpack.Unmarshal(data, &msg); err != nil {
        return "ERROR", []byte("invalid payload"), nil
    }

    // Process and broadcast...
    response, _ := msgpack.Marshal(map[string]string{"status": "sent"})
    return "CHAT_SENT", response, nil
}
```

## Error Handling

- Return a non-nil `error` to send an error frame back to the client
- The error message is serialized into the `Error` field of the response frame
- The connection is **not** closed on error — only the specific message fails
