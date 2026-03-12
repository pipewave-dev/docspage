# Cookie & Sticky Sessions

Pipewave uses a cookie-based mechanism to enable sticky sessions, reducing unnecessary cross-container message broadcasting.

## Handshake Flow

Before opening a WebSocket connection, the client performs a handshake with the Pipewave HTTP endpoint to obtain a temporary token:

```
Client                            Pipewave
  │                                   │
  │  POST /issue-tmp-token            │
  │  Authorization: Bearer <jwt>      │
  │──────────────────────────────>    │
  │                                   │  1. Validate token via InspectToken
  │                                   │  2. Issue temporary token
  │                                   │  3. Set-Cookie: __pw_uid=<userID>
  │  200 OK                           │
  │  { "token": "<temp-token>" }      │
  │  Set-Cookie: __pw_uid=<userID>    │
  │<──────────────────────────────────│
  │                                   │
  │  WS /gw?tk=<temp>                 │  4. Connect WS use temporary token
  │──────────────────────────────────>│
  │  101 Switching Protocols          │
  │<──────────────────────────────────│
```

The temporary token is short-lived and scoped to a single WebSocket upgrade. The cookie, however, persists across reconnects.

## The `__pw_uid` Cookie

During the handshake, Pipewave sets an HTTP-only cookie containing the resolved user ID:

| Attribute  | Value             |
|------------|-------------------|
| Name       | `__pw_uid`          |
| Value      | resolved `userID` |
| HttpOnly   | `true`            |
| SameSite   | `Strict`          |

This cookie is read by the load balancer on subsequent requests to route the client back to the same container.

## Sticky Session Routing

With the `pw_uid` cookie in place, the load balancer can apply cookie-based sticky routing:

```
Browser                   Load Balancer              Pods
   │                            │                      │
   │  Cookie: __pw_uid=user-42  │                      │
   │───────────────────────────>│                      │
   │                            │  route to pod-2      │
   │                            │─────────────────────>│ pod-1
   │                            │─────────────────────>│ pod-2 ← always here
   │                            │─────────────────────>│ pod-3
```

The same user ID is always directed to the same pod as long as the pod is healthy.

## Why This Matters

Without sticky sessions, a message targeting `user-42` must be broadcast via PubSub to **every** pod so that whichever pod holds the connection can deliver it:

```
Without sticky sessions:

Message for user-42
       │
       ├──> pod-1 (checks: not here, drops)
       ├──> pod-2 (checks: found!, delivers)
       ├──> pod-3 (checks: found!, delivers)
       └──> pod-4 (checks: found!, delivers)
```

With sticky sessions, Pipewave knows which pod holds the connection and can publish the message directly:

```
With sticky sessions:

Message for user-42
       │
       ├──> pod-1 (checks: not here, drops)
       ├──> pod-2 (checks: found!, delivers) // Only 1 pod connect to user-42
       ├──> pod-3 (checks: not here, drops)
       └──> pod-4 (checks: not here, drops)
```

This reduces wasted CPU cycles on pods that do not hold the target connection.

## Fallback Behavior

Sticky sessions are an **optimization**, not a requirement. If a pod goes down or the cookie is absent, the load balancer falls back to standard round-robin routing. Pipewave handles this transparently — message delivery still works via the PubSub layer, just with slightly higher broadcast overhead until the client reconnects to any healthy pod.

