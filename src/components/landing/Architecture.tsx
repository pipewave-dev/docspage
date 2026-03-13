import { motion } from 'framer-motion'

export default function Architecture() {
  return (
    <section id="architecture" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for scale
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Horizontally scalable architecture with no sticky sessions
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/30 p-6 sm:p-10">
            <svg viewBox="0 0 800 420" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Clients */}
              <g>
                <text x="80" y="30" fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor="middle">CLIENTS</text>
                {[0, 1, 2].map((i) => (
                  <g key={`client-${i}`}>
                    <rect x={30 + i * 50} y={45} width="40" height="30" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <text x={50 + i * 50} y={65} fill="#67e8f9" fontSize="10" textAnchor="middle">
                      {['WS', 'WS', 'LP'][i]}
                    </text>
                  </g>
                ))}
                {/* Connection lines */}
                <path d="M80 75 L80 110 L250 110" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M130 75 L130 95 L250 95" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              </g>

              {/* Load Balancer */}
              <g>
                <rect x="230" y="80" width="120" height="45" rx="8" fill="#0f172a" stroke="#0891b2" strokeWidth="1.5" />
                <text x="290" y="100" fill="#22d3ee" fontSize="11" fontWeight="600" textAnchor="middle">Load Balancer</text>
                <text x="290" y="115" fill="#64748b" fontSize="9" textAnchor="middle">No Sticky Session</text>
              </g>

              {/* Backend Instances */}
              <g>
                <text x="400" y="165" fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor="middle">ECHOWAVE INSTANCES</text>

                {[0, 1, 2].map((i) => (
                  <g key={`server-${i}`}>
                    <rect x={260 + i * 100} y={180} width="85" height="55" rx="8" fill="#0f172a" stroke="#0891b2" strokeWidth="1.5" />
                    <text x={302 + i * 100} y={200} fill="#22d3ee" fontSize="10" fontWeight="500" textAnchor="middle">
                      Instance {i + 1}
                    </text>
                    <text x={302 + i * 100} y={215} fill="#64748b" fontSize="8" textAnchor="middle">
                      kqueue/netpoll
                    </text>
                    <text x={302 + i * 100} y={227} fill="#64748b" fontSize="8" textAnchor="middle">
                      zero-alloc idle
                    </text>
                  </g>
                ))}

                {/* LB to instances */}
                <path d="M290 125 L290 145 L302 180" stroke="#0891b2" strokeWidth="1" opacity="0.5" />
                <path d="M290 125 L350 145 L402 180" stroke="#0891b2" strokeWidth="1" opacity="0.5" />
                <path d="M290 125 L420 145 L502 180" stroke="#0891b2" strokeWidth="1" opacity="0.5" />
              </g>

              {/* PubSub */}
              <g>
                <rect x="300" y="280" width="200" height="50" rx="10" fill="#0f172a" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="400" y="302" fill="#2dd4bf" fontSize="12" fontWeight="600" textAnchor="middle">PubSub (Valkey/Redis)</text>
                <text x="400" y="318" fill="#64748b" fontSize="9" textAnchor="middle">Cross-instance broadcast</text>

                {/* Instance to PubSub */}
                <path d="M302 235 L350 280" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
                <path d="M402 235 L400 280" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
                <path d="M502 235 L450 280" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
              </g>

              {/* Database */}
              <g>
                <rect x="580" y="180" width="170" height="50" rx="10" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="665" y="202" fill="#c4b5fd" fontSize="11" fontWeight="600" textAnchor="middle">Connection Store</text>
                <text x="665" y="218" fill="#64748b" fontSize="9" textAnchor="middle">DynamoDB / Adapter</text>

                {/* Instance to DB */}
                <path d="M545 207 L580 207" stroke="#a78bfa" strokeWidth="1" opacity="0.5" strokeDasharray="4 4" />
              </g>

              {/* Token Exchange */}
              <g>
                <rect x="580" y="80" width="170" height="45" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="665" y="100" fill="#fbbf24" fontSize="11" fontWeight="600" textAnchor="middle">Auth Service</text>
                <text x="665" y="115" fill="#64748b" fontSize="9" textAnchor="middle">InspectToken()</text>

                <path d="M580 102 L545 102 L545 180" stroke="#f59e0b" strokeWidth="1" opacity="0.4" strokeDasharray="4 4" />
              </g>

              {/* Legend */}
              <g>
                <rect x="30" y="370" width="8" height="8" rx="2" fill="#0891b2" />
                <text x="44" y="378" fill="#64748b" fontSize="9">WebSocket / HTTP</text>

                <rect x="160" y="370" width="8" height="8" rx="2" fill="#14b8a6" />
                <text x="174" y="378" fill="#64748b" fontSize="9">PubSub Channel</text>

                <rect x="290" y="370" width="8" height="8" rx="2" fill="#a78bfa" />
                <text x="304" y="378" fill="#64748b" fontSize="9">Persistence</text>

                <rect x="400" y="370" width="8" height="8" rx="2" fill="#f59e0b" />
                <text x="414" y="378" fill="#64748b" fontSize="9">Authentication</text>
              </g>
            </svg>
          </div>

          {/* Flow description */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                color: 'text-cyan-400',
                title: 'Connect',
                desc: 'Clients connect via WebSocket or Long Polling. The Load Balancer distributes traffic — no sticky sessions needed.',
              },
              {
                color: 'text-cyan-300',
                title: 'Process',
                desc: 'Each Pipewave instance handles connections with kqueue/epoll for minimal memory usage, even with thousands of idle connections.',
              },
              {
                color: 'text-teal-400',
                title: 'Broadcast',
                desc: 'PubSub (Valkey/Redis) enables cross-instance messaging. A message sent on Instance 1 reaches users on Instance 3.',
              },
              {
                color: 'text-purple-400',
                title: 'Persist',
                desc: 'Connection state is stored in PostgreSQL or DynamoDB, making every instance stateless and replaceable.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-800/40 bg-slate-900/20 p-4">
                <h4 className={`text-sm font-semibold ${item.color}`}>{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
