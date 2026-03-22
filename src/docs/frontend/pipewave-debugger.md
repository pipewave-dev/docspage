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

### Custom position and side

```tsx
<PipewaveDebugger
  panelSide="right"
  buttonPosition={{ bottom: 24, right: 24 }}
  buttonLabel="WS Debug"
/>
```

### Disable logging by default, limit log history

```tsx
<PipewaveDebugger
  defaultEnabled={false}
  maxLogs={50}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultEnabled` | `boolean` | `true` | Start collecting events on mount. When `false`, the badge is visible but logging is paused until manually enabled. |
| `maxLogs` | `number` | `200` | Maximum number of log entries kept in memory (circular buffer). Oldest entries are dropped when the limit is reached. |
| `buttonLabel` | `string` | `'🐛 PW'` | Text displayed on the floating badge button. |
| `buttonPosition` | `ButtonPosition` | `{ bottom: 16, left: 16 }` | CSS position of the floating badge. Accepts any combination of `top`, `bottom`, `left`, `right` (numbers are treated as pixels). |
| `panelSide` | `PanelSide` | `'left'` | Which side of the viewport the debug panel slides in from. |

## Types

### `PanelSide`

```ts
type PanelSide = 'left' | 'right'
```

### `ButtonPosition`

```ts
interface ButtonPosition {
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
}
```

All fields are optional. Numeric values are interpreted as pixels. String values are passed through as-is (e.g. `'10vh'`).

## Interface

### Badge

A small badge appears in the **bottom-left corner** of the screen by default:

```
🐛 PW
```

Click the badge to open or close the debug panel. The badge uses `z-index: 9999` and does not affect page layout. Its position and label can be customised via the `buttonPosition` and `buttonLabel` props.

### Debug Panel

The panel is fixed to the **left side** of the viewport by default (configurable via `panelSide`) with:

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
| **ID** | First 6 characters of the Message ID (full value in tooltip) |
| **MsgType** | Message type, auto-colored per type |
| **ReturnToID** | Reply-to message ID (truncated with tooltip) |
| **Size** | Payload size in bytes |
| **Err** | `✓` for no error, `✗` for error |

For non-data events (`open`, `close`, `error`, etc.) the last five columns are replaced by a single text message spanning all columns.

### Event Types

| Type | Description | Color |
|------|-------------|-------|
| `open` | WebSocket connection established | Green |
| `close` | Connection closed | Orange |
| `error` | Connection error | Red |
| `recv` | Data received from server | Cyan |
| `sent` | Data sent to server | Light green |
| `reconnect` | Reconnection attempt | Yellow |
| `maxRetry` | Retry limit reached | Yellow |
| `transport` | Transport switch (WebSocket ↔ Long Polling) | Purple |
| `status` | Connection status changed | Purple |

## Filtering by MsgType

Above the log table, **filter chips** show all `MsgType` values that have appeared in the current session.

- Click a chip to toggle filtering by that message type.
- Multiple chips can be active simultaneously.
- When filters are active, the table header shows filtered vs. total count — e.g. `3 / 47 events`.
- Click the **✕ clear** chip to remove all active filters.
- Non-data events (connection lifecycle) are always shown regardless of the filter.

## Inspecting Payload

Click any `recv` or `sent` row to expand it and view the decoded payload:

1. A row of **decoder chip buttons** to switch format on the fly.
2. The **decoded content** in a scrollable block (max height 200px).

## Decoders

Pipewave transmits data as binary (`Uint8Array`). The debugger includes built-in decoders:

| Name | Description |
|------|-------------|
| **UTF-8 Text** | Decode binary as a UTF-8 string (default) |
| **MessagePack** | Deserialise MessagePack format and pretty-print as JSON |
| **Hex** | Display as hex string (e.g. `48 65 6c 6c 6f`) |
| **Base64** | Encode binary as Base64 |

## Runtime Controls

| Control | Location | Effect |
|---------|----------|--------|
| **Enable** checkbox | Panel header | Toggle log collection. Disabling keeps existing logs. |
| **Max logs** dropdown | Toolbar | Resize the circular buffer (10 / 20 / 50 / 100 / 200 / 500). Reducing immediately trims oldest entries. |
| **🗑 Clear** button | Toolbar | Delete all current log entries. |
| **Badge click** | Configured position | Toggle panel open/closed. Log collection continues while closed. |

## Notes

### Performance

- Default buffer is **200 entries**. For high-traffic systems, reduce `maxLogs` or disable the debugger when not needed.
- Each `recv`/`sent` event stores the raw `Uint8Array`, so memory usage scales with payload size.

### z-index

The panel (`z-index: 10000`) and badge (`z-index: 9999`) render above most UI. If your app has modals with higher z-index values, override with CSS as needed.

### Context Requirement

`PipewaveDebugger` must be rendered inside `<PipewaveProvider>`. Rendering it outside will throw a context error.
