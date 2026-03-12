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
            { title: 'Architecture', path: '/docs/architecture' },
        ],
    },
    {
        title: 'Backend Integration',
        path: '/docs/backend/quick-start',
        children: [
            { title: 'Quick Start', path: '/docs/backend/quick-start' },
            { title: 'Configuration', path: '/docs/backend/configuration' },
            { title: 'InspectToken Function', path: '/docs/backend/inspect-fn' },
            { title: 'HandleMessage Function', path: '/docs/backend/handler-fn' },
            { title: 'Module API', path: '/docs/backend/module-api' },
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
            { title: 'Binary Protocol', path: '/docs/frontend/binary-protocol' },
            { title: 'Long Polling Fallback', path: '/docs/frontend/long-polling-fallback' },
        ],
    },
]

export const mainNavLinks = [
    { title: 'Features', href: '/#features' },
    { title: 'How It Works', href: '/#how-it-works' },
    { title: 'Architecture', href: '/#architecture' },
    { title: 'Docs', href: '/docs' },
]
