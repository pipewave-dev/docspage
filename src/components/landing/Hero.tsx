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
        <div className="mx-auto mt-16 grid max-w-5xl gap-4 lg:grid-cols-2">
          {/* Frontend */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm h-full">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span>useChat.ts</span>
                <span className="ml-auto rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-medium text-primary-400">Frontend</span>
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

          {/* Backend */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm h-full">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span>main.go</span>
                <span className="ml-auto rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-400">Backend</span>
              </div>
              <div className="mt-4 font-mono text-[13px] leading-relaxed">
                <div className="flex gap-3">
                  <span className="text-slate-600 select-none w-4 text-right shrink-0">1</span>
                  <span><span className="text-primary-300">pw</span> := <span className="text-yellow-300">pipewave</span>.<span className="text-yellow-300">New</span>(config)</span>
                </div>
                <div className="h-2" />
                <div className="flex gap-3">
                  <span className="text-slate-600 select-none w-4 text-right shrink-0">2</span>
                  <span><span className="text-primary-300">pw</span>.<span className="text-yellow-300">Handle</span>(<span className="text-green-300">"CHAT_MESSAGE"</span>, func(<span className="text-orange-300">ctx</span>, <span className="text-orange-300">msg</span>) {'{'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-600 select-none w-4 text-right shrink-0">3</span>
                  <span className="pl-4"><span className="text-primary-300">ctx</span>.<span className="text-yellow-300">Broadcast</span>(<span className="text-orange-300">msg</span>)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-600 select-none w-4 text-right shrink-0">4</span>
                  <span>{'}'})</span>
                </div>
                <div className="h-2" />
                <div className="flex gap-3">
                  <span className="text-slate-600 select-none w-4 text-right shrink-0">5</span>
                  <span><span className="text-primary-300">pw</span>.<span className="text-yellow-300">Listen</span>(<span className="text-green-300">":8080"</span>)</span>
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
    </section>
  )
}
