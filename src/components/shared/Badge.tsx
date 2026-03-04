interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent'
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
