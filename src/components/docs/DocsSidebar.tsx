import { Link, useLocation } from 'react-router-dom'
import { docsNavigation } from '@/constants/navigation'

interface DocsSidebarProps {
  onNavigate?: () => void
}

export default function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  const location = useLocation()

  return (
    <nav className="space-y-6">
      {docsNavigation.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.children?.map((item) => {
              const isActive = location.pathname === item.path
              const isGroupOpen = item.children && (
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/')
              )
              const isGroupActive = !isActive && isGroupOpen
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onNavigate}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive || isGroupActive
                        ? 'bg-primary-500/10 font-medium text-primary-400'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    {item.title}
                  </Link>
                  {item.children && isGroupOpen && (
                    <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700/50 pl-3">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path
                        return (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              onClick={onNavigate}
                              className={`block rounded-md px-2 py-1 text-sm transition-colors ${
                                isChildActive
                                  ? 'font-medium text-primary-400'
                                  : 'text-slate-500 hover:text-slate-200'
                              }`}
                            >
                              {child.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
