import { motion } from 'framer-motion'

const steps = [
    {
        step: '00',
        title: 'Install Dependencies',
        description: 'Add the Go backend package and the React frontend SDK to your project.',
        code: `# Backend (Go)
go get github.com/pipewave-dev/go-pkg

# Frontend (React)
npm install @pipewave/reactpkg @msgpack/msgpack`,
        lang: 'Bash',
    },
    {
        step: '01',
        title: 'Setup Backend',
        description: 'Create a Pipewave instance, provide InspectToken and HandleMessage, then mount the mux.',
        code: `pw := pipewave.NewPipewave(pipewave.PipewaveConfig{
  ConfigStore:       configprovider.FromGoStruct(cfg),
  RepositoryFactory: ddbRepo.NewPostgresRepo,
  QueueFactory:      queueprovider.QueueValkey,
})
pw.SetFns(&pipewave.FunctionStore{
  InspectToken:  inspectToken,
  HandleMessage: &myHandler{i: pw},
})
http.Handle("/pipewave/", pw.Mux())`,
        lang: 'Go',
    },
    {
        step: '02',
        title: 'Wrap Frontend',
        description: 'Create a PipewaveModuleConfig and wrap your app with PipewaveProvider.',
        code: `const config = new PipewaveModuleConfig({
  backendEndpoint: 'api.example.com/pipewave',
  getAccessToken: async () => getToken(),
})

<PipewaveProvider config={config}>
  <App />
</PipewaveProvider>`,
        lang: 'TSX',
    },
    {
        step: '03',
        title: 'Subscribe Events',
        description: 'Use usePipewave() hook with an OnMessage map to handle typed binary messages.',
        code: `const onMessage: OnMessage = useMemo(() => ({
  CHAT_INCOMING_MSG: async (data: Uint8Array, id) => {
    const msg = decode(data) as ChatPayload
    addMessage(msg)
  },
}), [])

const { status, send } = usePipewave(onMessage)`,
        lang: 'TSX',
    },
    {
        step: '04',
        title: 'Handle & Push from Server',
        description: 'Implement HandleMessage to receive client events and push data to any user.',
        code: `func (h *handler) HandleMessage(
  ctx context.Context, auth voAuth.WebsocketAuth,
  msgType string, data []byte,
) (outType string, res []byte, err error) {
  svc := h.i.Services()
  // parse data -> process data -> send to user
  svc.SendToUser(ctx, toUserID,
    "CHAT_INCOMING_MSG", msgpack.Marshal(payload))
  return "CHAT_ACK", ackData, nil // send ack to client
}`,
        lang: 'Go',
    },
]

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="relative py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        How it works
                    </h2>
                    <p className="mt-4 text-lg text-slate-400">
                        Five steps to real-time communication
                    </p>
                </div>

                <div className="mt-16 space-y-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col gap-6 rounded-xl border border-slate-800/60 bg-slate-900/30 p-6 md:flex-row md:items-start md:gap-8"
                        >
                            {/* Step number */}
                            <div className="flex shrink-0 items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 text-lg font-bold text-primary-400">
                                    {step.step}
                                </div>
                                <div className="md:hidden">
                                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                    <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                                </div>
                            </div>

                            {/* Description - desktop */}
                            <div className="hidden w-48 shrink-0 md:block">
                                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                            </div>

                            {/* Code */}
                            <div className="min-w-0 flex-1">
                                <div className="rounded-lg bg-[#0d1117] p-4">
                                    <div className="mb-2 text-xs font-medium text-slate-500">{step.lang}</div>
                                    <pre className="overflow-x-auto font-mono text-sm leading-6 text-slate-300">
                                        <code>{step.code}</code>
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
