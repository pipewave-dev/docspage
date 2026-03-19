export interface NavItem {
    title: string
    path: string
    children?: NavItem[]
}

export const docsNavigation: NavItem[] = [
    {
        title: 'Getting Started',
        path: '/docs',
        children: [
            { title: 'Overview', path: '/docs' },
            { title: 'Core Concepts', path: '/docs/concepts' },
            { title: 'Tutorial', path: '/docs/tutorial' },
            { title: 'Architecture', path: '/docs/architecture' },
        ],
    },
    {
        title: 'Backend Integration',
        path: '/docs/backend/quick-start',
        children: [
            { title: 'Quick Start', path: '/docs/backend/quick-start' },
            { title: 'InspectToken Function', path: '/docs/backend/inspect-fn' },
            { title: 'HandleMessage Function', path: '/docs/backend/handler-fn' },
            {
                title: 'Module API',
                path: '/docs/backend/module-api',
                children: [
                    { title: 'SendToUser', path: '/docs/backend/module-api/send-to-user' },
                    { title: 'SendToSession', path: '/docs/backend/module-api/send-to-session' },
                    { title: 'SendToUsers', path: '/docs/backend/module-api/send-to-users' },
                    { title: 'SendToAnonymous', path: '/docs/backend/module-api/send-to-anonymous' },
                    { title: 'Broadcast', path: '/docs/backend/module-api/broadcast' },
                    { title: 'SendToSessionWithAck', path: '/docs/backend/module-api/send-to-session-with-ack' },
                    { title: 'SendToUserWithAck', path: '/docs/backend/module-api/send-to-user-with-ack' },
                    { title: 'CheckOnline', path: '/docs/backend/module-api/check-online' },
                    { title: 'CheckOnlineMultiple', path: '/docs/backend/module-api/check-online-multiple' },
                    { title: 'GetUserSessions', path: '/docs/backend/module-api/get-user-sessions' },
                    { title: 'PingConnections', path: '/docs/backend/module-api/ping-connections' },
                    { title: 'DisconnectSession', path: '/docs/backend/module-api/disconnect-session' },
                    { title: 'DisconnectUser', path: '/docs/backend/module-api/disconnect-user' },
                    { title: 'OnNewRegister', path: '/docs/backend/module-api/on-new-register' },
                    { title: 'OnCloseRegister', path: '/docs/backend/module-api/on-close-register' },
                    { title: 'Monitoring', path: '/docs/backend/module-api/monitoring' },
                    { title: 'MetricsHandler', path: '/docs/backend/module-api/metrics' },
                    { title: 'IsHealthy', path: '/docs/backend/module-api/is-healthy' },
                    { title: 'Shutdown', path: '/docs/backend/module-api/shutdown' },
                ],
            },
            { title: 'Configuration', path: '/docs/backend/configuration' },
            { title: 'Cookie & Sticky Sessions', path: '/docs/backend/cookie' },
            { title: 'Scaling & Deployment', path: '/docs/backend/scaling' },
        ],
    },
    {
        title: 'Frontend Integration',
        path: '/docs/frontend/quick-start',
        children: [
            { title: 'Quick Start', path: '/docs/frontend/quick-start' },
            { title: 'PipewaveProvider', path: '/docs/frontend/pipewave-provider' },
            { title: 'usePipewave Hook', path: '/docs/frontend/use-pipewave-hook' },
            {
                title: 'Hooks Reference',
                path: '/docs/frontend/hooks',
                children: [
                    { title: 'usePipewaveStatus', path: '/docs/frontend/hooks/use-pipewave-status' },
                    { title: 'usePipewaveSend', path: '/docs/frontend/hooks/use-pipewave-send' },
                    { title: 'usePipewaveMessage', path: '/docs/frontend/hooks/use-pipewave-message' },
                    { title: 'usePipewaveError', path: '/docs/frontend/hooks/use-pipewave-error' },
                    { title: 'usePipewaveResetConnection', path: '/docs/frontend/hooks/use-pipewave-reset-connection' },
                    { title: 'usePipewaveLatestMessage', path: '/docs/frontend/hooks/use-pipewave-latest-message' },
                    { title: 'usePipewaveMessageHistory', path: '/docs/frontend/hooks/use-pipewave-message-history' },
                    { title: 'usePipewaveSendWaitAck', path: '/docs/frontend/hooks/use-pipewave-send-wait-ack' },
                    { title: 'usePipewaveConnectionInfo', path: '/docs/frontend/hooks/use-pipewave-connection-info' },
                ],
            },
            { title: 'PipewaveDebugger', path: '/docs/frontend/pipewave-debugger' },
            { title: 'Binary Protocol', path: '/docs/frontend/binary-protocol' },
            { title: 'Long Polling Fallback', path: '/docs/frontend/long-polling-fallback' },
            { title: 'API Reference', path: '/docs/frontend/api-reference' },
        ],
    },
    {
        title: 'Help',
        path: '/docs/troubleshooting',
        children: [
            { title: 'Troubleshooting', path: '/docs/troubleshooting' },
        ],
    },
]

export const mainNavLinks = [
    { title: 'Features', href: '/#features' },
    { title: 'How It Works', href: '/#how-it-works' },
    { title: 'Architecture', href: '/#architecture' },
    { title: 'Docs', href: '/docs' },
]
