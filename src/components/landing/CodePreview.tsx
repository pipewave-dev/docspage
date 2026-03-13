import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeBlock from '../docs/CodeBlock'

const backendCode = `package main

import (
    app "git.ponos-tech.com/pipewave/backend/app"
    config "git.ponos-tech.com/pipewave/backend/provider/config-provider"
    "context"
    "net/http"
)

func main() {
    cfg := config.FromYaml([]string{".config.yaml"}, &config.Fns{
        InspectToken: func(ctx context.Context, token string) (string, bool, error) {
            user, err := auth.ValidateToken(ctx, token)
            return user.ID, false, err
        },
        HandleMessage: func(ctx context.Context, auth Auth, msgType string, data []byte) (string, []byte, error) {
            switch msgType {
            case "CHAT_SEND":
                return handleChat(ctx, auth, data)
            default:
                return "ERROR", []byte("unknown type"), nil
            }
        },
    })

    di := app.NewPipewave(cfg)
    http.ListenAndServe(":8080", di.Delivery.Mux())
}`

const frontendCode = `import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/react'
import { usePipewave } from '@pipewave/react/hooks'
import { useMemo, useState } from 'react'

// 1. Configure the provider
const config = new PipewaveModuleConfig({
    backendEndpoint: 'api.example.com/websocket',
    getAccessToken: async () => localStorage.getItem("token") || "",
})

export function App() {
    return (
        <PipewaveProvider config={config}>
            <ChatRoom />
        </PipewaveProvider>
    )
}

// 2. Use the hook in any component
function ChatRoom() {
    const [messages, setMessages] = useState<string[]>([])

    const handlers = useMemo(() => ({
        CHAT_MESSAGE: async (data: Uint8Array) => {
            const msg = new TextDecoder().decode(data)
            setMessages(prev => [...prev, msg])
        },
    }), [])

    const { status, send } = usePipewave(handlers)

    return (
        <div>
            <span>Status: {status}</span>
            {messages.map((m, i) => <p key={i}>{m}</p>)}
        </div>
    )
}`

const tabs = [
  { id: 'backend', label: 'Go Backend', language: 'go', code: backendCode },
  { id: 'frontend', label: 'React Frontend', language: 'tsx', code: frontendCode },
]

export default function CodePreview() {
  const [activeTab, setActiveTab] = useState('backend')
  const active = tabs.find((t) => t.id === activeTab)!

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Clean, minimal setup on both sides
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="code-tab"
                    className="absolute inset-0 rounded-lg bg-slate-800"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Code block */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CodeBlock code={active.code} language={active.language} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
