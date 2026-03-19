# PipewaveDebugger

A visual WebSocket debugging panel for React applications using `@pipewave/reactpkg`. Displays a floating badge that opens a real-time event log of all WebSocket activity.

> npm: [@pipewave/reactpkg](https://www.npmjs.com/package/@pipewave/reactpkg) · Source: [github.com/pipewave-dev/reactpkg](https://github.com/pipewave-dev/reactpkg)

## Basic Usage

`PipewaveDebugger` must be placed **inside `<PipewaveProvider>`** to access the connection context.

```tsx
import { PipewaveProvider, PipewaveModuleConfig, PipewaveDebugger } from '@pipewave/reactpkg'

const config = new PipewaveModuleConfig({
    backendEndpoint: 'localhost:8080/pipewave',
    getAccessToken: async () => yourToken,
})

function App() {
    return (
        <PipewaveProvider config={config}>
            <YourAppContent />
            <PipewaveDebugger />
        </PipewaveProvider>
    )
}
```

> **Tip:** Place `<PipewaveDebugger />` at the **end of `PipewaveProvider`'s children** so the panel renders above other UI layers.

### Development-only (recommended)

```tsx
function App() {
    return (
        <PipewaveProvider config={config}>
            <YourAppContent />
            {import.meta.env.DEV && <PipewaveDebugger />}
        </PipewaveProvider>
    )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultEnabled` | `boolean` | `true` | Start collecting events on mount. When `false`, the badge is visible but logging is paused until manually enabled. |
| `maxLogs` | `number` | `200` | Maximum number of log entries kept in memory (circular buffer). Oldest entries are dropped when the limit is reached. |

## Interface

### Badge

A small badge appears in the **bottom-left corner** of the screen:

```
🐛 PW
```

Click the badge to open or close the debug panel. The badge uses `z-index: 9999` and does not affect page layout.

### Debug Panel

The panel is fixed to the **left side** of the viewport with:

- **Width:** 560px
- **Height:** full viewport
- **Theme:** Dark (Dracula)
- **z-index:** 10000

The panel header includes an **Enable** checkbox and a close button (`✕`). The body shows the event log table.

## Event Log

Each WebSocket event appears as a row in the log table:

| Column | Description |
|--------|-------------|
| **Time** | Event timestamp (`HH:MM:SS`) |
| **Type** | Event type, color-coded |
| **ID** | First 8 characters of the Message ID |
| **MsgType** | Message type, auto-colored per type |
| **ReturnToID** | Response target ID (only on `recv` events) |
| **Size** | Payload size in bytes |
| **Err** | `✓` for no error, `✗` for error |

### Event Types

| Type | Description | Color |
|------|-------------|-------|
| `open` | WebSocket connection established | Green |
| `close` | Connection closed | Red |
| `error` | Connection error | Red (bold) |
| `recv` | Data received from server | Cyan |
| `sent` | Data sent to server | Magenta |
| `reconnect` | Reconnection attempt | Yellow |
| `maxRetry` | Retry limit reached | Orange-red |
| `transport` | Transport switch (WebSocket ↔ Long Polling) | Light blue |
| `status` | Connection status changed | Gray |

## Filtering by MsgType

Above the log table, **filter chips** show all `MsgType` values that have appeared in the current session.

- Click a chip to toggle filtering by that message type.
- Multiple chips can be active simultaneously.
- When filters are active, the table header shows filtered vs. total count — e.g. `3 / 47 events`.
- Click the **X** next to the counter to clear all filters.

## Inspecting Payload

Click any `recv` or `sent` row to expand it and view the raw payload. The expanded row shows:

1. A **decoder selector** dropdown
2. The **decoded content** as text, JSON, or hex

## Decoders

Pipewave transmits data as binary (`Uint8Array`). The debugger includes built-in decoders:

| Name | Description |
|------|-------------|
| **UTF-8 Text** | Decode binary as a UTF-8 string |
| **MessagePack** | Decode MessagePack format to JSON |
| **Hex** | Display as hex string (e.g. `48 65 6c 6c 6f`) |
| **Base64** | Encode binary as Base64 |

### Custom Decoders

Write a custom decoder directly in the panel UI:

```js
function decode(data) {
    // data: Uint8Array
    const text = new TextDecoder().decode(data)
    return JSON.stringify(JSON.parse(text), null, 2)
}
```

Custom decoders and the selected decoder are persisted in `localStorage`.

## Runtime Controls

| Control | Location | Effect |
|---------|----------|--------|
| **Enable** checkbox | Panel header | Toggle log collection. Disabling keeps existing logs. |
| **Max logs** dropdown | Toolbar | Resize the circular buffer (10 / 20 / 50 / 100 / 200 / 500). |
| **Clear** button | Toolbar | Delete all current log entries. |
| **Badge click** | Bottom-left | Toggle panel open/closed. Log collection continues while closed. |

## Notes

### Performance

- Default buffer is **200 entries**. For high-traffic systems, reduce `maxLogs` or disable the debugger when not needed.
- Each `recv`/`sent` event stores the raw `Uint8Array`, so memory usage scales with payload size.

### z-index

The panel (`z-index: 10000`) and badge (`z-index: 9999`) render above most UI. If your app has modals with higher z-index values, override with CSS as needed.

### Context Requirement

`PipewaveDebugger` must be rendered inside `<PipewaveProvider>`. Rendering it outside will throw a context error.
