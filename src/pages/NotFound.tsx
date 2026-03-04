import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-primary-400">404</h1>
      <p className="mt-4 text-lg text-slate-400">Page not found</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500"
      >
        Back to Home
      </Link>
    </div>
  )
}
