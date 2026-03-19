import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeBlock from '../docs/CodeBlock'

const backendCode = `package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	pipewave "github.com/pipewave-dev/go-pkg"
	ddbRepo "github.com/pipewave-dev/go-pkg/core/repository/impl-postgres"
	configprovider "github.com/pipewave-dev/go-pkg/provider/config-provider"
	queueprovider "github.com/pipewave-dev/go-pkg/provider/queue"
)

func main() {
	cfg := configprovider.FromYaml([]string{".config.yaml"})
	pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
		ConfigStore:       cfg,
		RepositoryFactory: ddbRepo.NewPostgresRepo,
		QueueFactory:      queueprovider.QueueValkey,
	})
	pw.SetFns(&configprovider.Fns{
		InspectToken: func(ctx context.Context, token string) (userId string, isAnonymous bool, err error) {
			user, err := auth.ValidateToken(ctx, token) // Provide your auth function
			return user.ID, false, err
		},
		HandleMessage: &handleMsg{i: pw},
	})
	server := &http.Server{
		Addr:    ":8080",
		Handler: pw.Mux(),
	}
	go func() {
		fmt.Println("Starting server on :8080")
		if err := server.ListenAndServe(); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
		}
	}()

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)
	<-signalChan
	fmt.Println("Shutting down server...")
	pw.Shutdown()
}

type handleMsg struct {
	i *pipewave.Pipewave
}

const (
	ECHO_RESPONSE = "ECHO_RESPONSE"
)

func (h *handleMsg) HandleMessage(ctx context.Context, auth pipewave.Auth, msgType string, data []byte) (string, []byte, error) {
	fmt.Printf("Got type[%s]: %s\n", msgType, string(data))
	res := fmt.Sprintf("Echo: %s", string(data))
	return ECHO_RESPONSE, []byte(res), nil
}`

const frontendCode = `import { PipewaveProvider, PipewaveModuleConfig } from '@pipewave/react'
import { usePipewave } from '@pipewave/react/hooks'
import { useState } from 'react'

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

    const { status, send } = usePipewave({
        CHAT_MESSAGE: async (data: Uint8Array) => {
            const msg = new TextDecoder().decode(data)
            setMessages(prev => [...prev, msg])
        },
    })

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
                                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
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
