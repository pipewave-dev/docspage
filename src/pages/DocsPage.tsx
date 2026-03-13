import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DocsLayout from '@/components/docs/DocsLayout'
import MarkdownRenderer from '@/components/docs/MarkdownRenderer'

const docsModules = import.meta.glob('../docs/**/*.md', { query: '?raw', import: 'default' })

function pathToDocKey(pathname: string): string {
  const path = pathname.replace('/docs', '').replace(/^\//, '') || 'index'
  return `../docs/${path}.md`
}

export default function DocsPage() {
  const location = useLocation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const key = pathToDocKey(location.pathname)
    const loader = docsModules[key]

    if (loader) {
      setLoading(true)
      ;(loader() as Promise<string>).then((md) => {
        setContent(md)
        setLoading(false)
      })
    } else {
      setContent('# Page Not Found\n\nThe requested documentation page could not be found.')
      setLoading(false)
    }
  }, [location.pathname])

  return (
    <DocsLayout>
      {loading ? (
        <div className="flex items-center gap-3 py-12 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-primary-400" />
          Loading...
        </div>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </DocsLayout>
  )
}
