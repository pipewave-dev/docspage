import { Link, useLocation } from 'react-router-dom'
import { docsNavigation } from '@/constants/navigation'
import type { NavItem } from '@/constants/navigation'

interface DocsSidebarProps {
  onNavigate?: () => void
}

export default function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  const location = useLocation()

  return (
    <nav className="space-y-6">
      {docsNavigation.map((section: NavItem) => (
        <div key={section.title}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.children?.map((item: NavItem) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onNavigate}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-500/10 font-medium text-primary-400'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
