import { motion } from 'framer-motion'

const roadmapItems = [
  { status: 'done', title: 'Core WebSocket Module', description: 'High-performance Go WebSocket engine with binary framing' },
  { status: 'done', title: 'Long Polling Fallback', description: 'Seamless fallback with batched message delivery' },
  { status: 'done', title: 'React Hook Support', description: 'usePipewave() hook with multiplexed event handlers' },
  { status: 'soon', title: 'More Database Adapters', description: 'Support for PostgreSQL, MySQL, and more storage backends' },
  { status: 'soon', title: 'More PubSub Adapters', description: 'NATS, Kafka, and other message broker integrations' },
  { status: 'soon', title: 'Multi-Language API', description: 'Expose Pipewave services beyond Go — Python, Node.js, etc.' },
  { status: 'soon', title: 'Metrics & Observability', description: 'Prometheus metrics, OpenTelemetry tracing, dashboards' },
]

export default function Roadmap() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Roadmap
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Where we've been and where we're headed
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 h-full w-px bg-slate-800" />

            <div className="space-y-6">
              {roadmapItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="relative flex gap-4 pl-1"
                >
                  {/* Dot */}
                  <div className={`relative z-10 mt-1.5 flex h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-950 ${
                    item.status === 'done'
                      ? 'bg-green-400'
                      : 'bg-slate-600'
                  }`}>
                    {/* Left margin for line alignment */}
                    <div className="ml-[3.5px]" />
                  </div>

                  <div className="flex-1 rounded-lg border border-slate-800/60 bg-slate-900/30 p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      {item.status === 'done' ? (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          Shipped
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-400">
                          Planned
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
