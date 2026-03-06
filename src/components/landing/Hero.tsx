import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Badge from '../shared/Badge'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge>Open Source WebSocket Engine</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Real-time WebSocket,{' '}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Simplified
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-slate-400"
          >
            A high-performance Go module and TypeScript SDK for real-time communication.
            Binary protocol, user-based messaging, and horizontal scalability — out of the box.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-primary-500/20 transition-all hover:shadow-primary-500/30 hover:brightness-110"
            >
              Get Started
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="https://git.ponos-tech.com/pipewave"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/50 hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View on Git
            </a>
          </motion.div>
        </div>

        {/* Code preview — Frontend & Backend */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-2">

          {/* ── Frontend column ── */}
          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-2"
            >
              <span className="rounded-full bg-primary-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary-400">Frontend</span>
              <span className="text-xs text-slate-600">TypeScript SDK</span>
            </motion.div>

            {/* app.tsx */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span>app.tsx</span>
                  <span className="ml-auto text-[10px] text-slate-600">wrap your app once — point to your server</span>
                </div>
                <div className="mt-4 font-mono text-[13px] leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">1</span>
                    <span><span className="text-purple-400">const</span> <span className="text-primary-300">config</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">PipewaveModuleConfig</span>({'({'}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">2</span>
                    <span className="pl-4"><span className="text-primary-300">backendEndpoint</span>: <span className="text-green-300">'localhost:8080/pipewave'</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">3</span>
                    <span className="pl-4"><span className="text-primary-300">getAccessToken</span>: <span className="text-purple-400">async</span> () =&gt; <span className="text-green-300">'token'</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">4</span>
                    <span>{'})' }</span>
                  </div>
                  <div className="h-2" />
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">5</span>
                    <span><span className="text-slate-500">&lt;</span><span className="text-yellow-300">PipewaveProvider</span> <span className="text-primary-300">config</span>={'{'}config{'}'}<span className="text-slate-500">&gt;</span></span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">6</span>
                    <span className="pl-4"><span className="text-slate-500">&lt;</span><span className="text-yellow-300">Chat</span> <span className="text-primary-300">toUserId</span>=<span className="text-green-300">"UserB"</span> <span className="text-slate-500">/&gt;</span></span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">7</span>
                    <span><span className="text-slate-500">&lt;/</span><span className="text-yellow-300">PipewaveProvider</span><span className="text-slate-500">&gt;</span></span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* useChat.ts */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span>useChat.ts</span>
                </div>
                <div className="mt-4 font-mono text-[13px] leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">1</span>
                    <span><span className="text-purple-400">const</span> <span className="text-primary-300">handlers</span> = <span className="text-yellow-300">useMemo</span>(() =&gt; ({'{'}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">2</span>
                    <span className="pl-4"><span className="text-primary-300">CHAT_MESSAGE</span>: <span className="text-yellow-300">handleChat</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">3</span>
                    <span className="pl-4"><span className="text-primary-300">NOTIFICATION</span>: <span className="text-yellow-300">showToast</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">4</span>
                    <span>{'}'}), [])</span>
                  </div>
                  <div className="h-2" />
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">5</span>
                    <span><span className="text-purple-400">const</span> {'{'} <span className="text-primary-300">send</span>, <span className="text-primary-300">status</span> {'}'} = <span className="text-yellow-300">usePipewave</span>(handlers)</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  WebSocket connected
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Backend column ── */}
          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-2"
            >
              <span className="rounded-full bg-accent-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-accent-400">Backend</span>
              <span className="text-xs text-slate-600">Go module</span>
            </motion.div>

            {/* main.go — combined */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span>main.go</span>
                  <span className="ml-auto text-[10px] text-slate-600">init + register hooks + serve</span>
                </div>
                <div className="mt-4 font-mono text-[13px] leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">1</span>
                    <span><span className="text-primary-300">pw</span> := <span className="text-yellow-300">pipewave</span>.<span className="text-yellow-300">NewPipewave</span>(<span className="text-yellow-300">pipewave</span>.<span className="text-yellow-300">PipewaveConfig</span>{'{'}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">2</span>
                    <span className="pl-4"><span className="text-primary-300">ConfigStore</span>:       <span className="text-orange-300">getConfig</span>(),</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">3</span>
                    <span className="pl-4"><span className="text-primary-300">RepositoryFactory</span>: <span className="text-yellow-300">ddbRepo</span>.<span className="text-orange-300">NewPostgresRepo</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">4</span>
                    <span className="pl-4"><span className="text-primary-300">QueueFactory</span>:      <span className="text-yellow-300">queueprovider</span>.<span className="text-orange-300">QueueValkey</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">5</span>
                    <span>{'})' }</span>
                  </div>
                  <div className="h-2" />
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">6</span>
                    <span><span className="text-primary-300">pw</span>.<span className="text-yellow-300">SetFns</span>(&<span className="text-yellow-300">pipewave</span>.<span className="text-yellow-300">FunctionStore</span>{'{'}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">7</span>
                    <span className="pl-4"><span className="text-primary-300">InspectToken</span>:  <span className="text-orange-300">inspectToken</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">8</span>
                    <span className="pl-4"><span className="text-primary-300">HandleMessage</span>: &<span className="text-orange-300">handleMsg</span>{'{'}<span className="text-primary-300">i</span>: <span className="text-primary-300">pw</span>{'}'}{','}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">9</span>
                    <span className="pl-4 text-slate-500">{'// OnNewConnection, OnCloseConnection'}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">10</span>
                    <span>{'})' }</span>
                  </div>
                  <div className="h-2" />
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">11</span>
                    <span><span className="text-primary-300">server</span> := &<span className="text-yellow-300">http</span>.<span className="text-yellow-300">Server</span>{'{'}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">12</span>
                    <span className="pl-4"><span className="text-primary-300">Addr</span>:    <span className="text-green-300">":8080"</span>,</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">13</span>
                    <span className="pl-4"><span className="text-primary-300">Handler</span>: <span className="text-yellow-300">http</span>.<span className="text-yellow-300">StripPrefix</span>(<span className="text-green-300">"/pipewave"</span>, <span className="text-primary-300">pw</span>.<span className="text-yellow-300">Mux</span>()),</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">14</span>
                    <span>{'}'}</span>
                  </div>
                  <div className="h-2" />
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">15</span>
                    <span><span className="text-purple-400">go</span> <span className="text-primary-300">server</span>.<span className="text-yellow-300">ListenAndServe</span>() <span className="text-slate-500">{'// non-blocking'}</span></span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">16</span>
                    <span><span className="text-slate-400">{'<-'}</span><span className="text-primary-300">signalChan</span>  <span className="text-slate-500">{'// wait for SIGTERM'}</span></span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right shrink-0">17</span>
                    <span><span className="text-primary-300">pw</span>.<span className="text-yellow-300">Shutdown</span>()   <span className="text-slate-500">{'// graceful drain'}</span></span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent-500/10 px-3 py-2 text-xs text-accent-400">
                  <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse" />
                  Listening on :8080
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
