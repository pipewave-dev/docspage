import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-accent-500">
                <svg className="h-5 w-5 text-slate-950" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 10 Q7 3 10 10 Q13 17 17 10" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">Pipewave</span>
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              High-performance WebSocket & Long-Polling engine for Go and React/TypeScript.
            </p>
          </div>

          {/* Docs */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Documentation</h3>
            <ul className="mt-3 space-y-2">
              <li><Link to="/docs" className="text-sm text-slate-500 hover:text-primary-400">Getting Started</Link></li>
              <li><Link to="/docs/backend/quick-start" className="text-sm text-slate-500 hover:text-primary-400">Backend Guide</Link></li>
              <li><Link to="/docs/frontend/quick-start" className="text-sm text-slate-500 hover:text-primary-400">Frontend Guide</Link></li>
              <li><Link to="/docs/architecture" className="text-sm text-slate-500 hover:text-primary-400">Architecture</Link></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Links</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="https://git.ponos-tech.com/pipewave" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-primary-400">
                  Source Code
                </a>
              </li>
              <li>
                <a href="https://ponos-tech.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-primary-400">
                  Ponos Tech
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/60 pt-6 text-center text-sm text-slate-600">
          Built by Ponos Tech
        </div>
      </div>
    </footer>
  )
}
