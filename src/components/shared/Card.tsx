import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur-sm transition-colors hover:border-slate-700/60 ${className}`}
    >
      {children}
    </motion.div>
  )
}
