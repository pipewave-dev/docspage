import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeBlock from '../docs/CodeBlock'

const databaseCode = `services:
  valkey:
    build:
      context: ./.docker/valkey
      dockerfile: Dockerfile
    ports:
      - 29103:6379
    command: valkey-server /usr/local/etc/valkey/valkey.conf
    networks:
      - pw-echo

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    ports:
      - "29104:5432"
    volumes:
      - ./tmp/postgres-data:/var/lib/postgresql/data
    networks:
      - pw-echo

networks:
  pw-echo:
    driver: bridge`

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
	pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
		ConfigStore:       getConfig(),
		RepositoryFactory: ddbRepo.NewPostgresRepo,
		QueueFactory:      queueprovider.QueueValkey,
	})
	pw.SetFns(&pipewave.FunctionStore{
		InspectToken:  inspectToken,
		HandleMessage: &handleMsg{i: pw},
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: http.StripPrefix("/pipewave", pw.Mux()),
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

// --- handlemsg.go ---

const (
	MsgTypeEchoReq = "ECHO_REQ"
	MsgTypeEchoRes = "ECHO_RES"
)

type handleMsg struct {
	i delivery.ModuleDelivery
}

func (h *handleMsg) HandleMessage(ctx context.Context, auth voAuth.WebsocketAuth, inputType string, data []byte) (string, []byte, error) {
	switch inputType {
	case MsgTypeEchoReq:
		msg := string(data)
		slog.Info("Received echo request", "message", msg)
		resMsg := []byte(fmt.Sprintf("Got [%s] at %s", msg, time.Now().Format(time.TimeOnly)))
		return MsgTypeEchoRes, resMsg, nil
	default:
		return "", nil, fmt.Errorf("unsupported message type: %s", inputType)
	}
}`

const frontendCode = `import { PipewaveProvider, PipewaveModuleConfig, PipewaveDebugger } from "@pipewave/reactpkg"
import { usePipewaveStatus, usePipewaveSend, usePipewaveMessage, usePipewaveResetConnection } from "@pipewave/reactpkg"
import { useState } from "react"

// 1. Configure the provider
const config = new PipewaveModuleConfig({
  backendEndpoint: "localhost:8080/pipewave",
  insecure: true,
  getAccessToken: async () => "default",
})

export default function App() {
  return (
    <PipewaveProvider config={config}>
      <EchoApp />
      <PipewaveDebugger />
    </PipewaveProvider>
  )
}

// 2. Use hooks in any component
const Encoder = new TextEncoder()
const Decoder = new TextDecoder()

export function EchoApp() {
  const [messages, setMessages] = useState<string[]>([])
  const { status, isConnected, isSuspended } = usePipewaveStatus()
  const { send } = usePipewaveSend()
  const { resetRetryCount } = usePipewaveResetConnection()

  usePipewaveMessage("ECHO_RES", async (data: Uint8Array) => {
    setMessages((prev) => [...prev, Decoder.decode(data)])
  })

  const handleSend = (text: string) => {
    send({ id: crypto.randomUUID(), msgType: "ECHO_REQ", data: Encoder.encode(text) })
  }

  return (
    <div>
      <p>Status: <span>{status}</span></p>
      {isSuspended && <button onClick={resetRetryCount}>Retry</button>}
      <input onKeyDown={(e) => e.key === "Enter" && handleSend(e.currentTarget.value)} />
      {messages.map((msg, i) => <p key={i}>{msg}</p>)}
    </div>
  )
}`

const tabs = [
    { id: 'backend', label: 'Backend', language: 'go', code: backendCode },
    { id: 'frontend', label: 'Frontend', language: 'tsx', code: frontendCode },
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
                    <p className="mt-2 text-sm text-slate-500">
                        Want to try it yourself?{' '}
                        <a
                            href="https://github.com/pipewave-dev/example/tree/main/01-echo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                        >
                            View the full example on GitHub
                        </a>
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
