import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DocsLayout from '@/components/docs/DocsLayout'
import MarkdownRenderer from '@/components/docs/MarkdownRenderer'

const docsModules = import.meta.glob('../docs/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

function pathToDocKey(pathname: string): string {
    const path = pathname.replace('/docs', '').replace(/^\//, '') || 'index'
    return `../docs/${path}.md`
}

const NOT_FOUND_MD = '# Page Not Found\n\nThe requested documentation page could not be found.'

export default function DocsPage() {
    const location = useLocation()
    const [loadedKey, setLoadedKey] = useState<string | null>(null)
    const [content, setContent] = useState('')

    const key = pathToDocKey(location.pathname)
    // Derived loading: true whenever the key we need ≠ the key already loaded
    const isLoading = loadedKey !== key

    useEffect(() => {
        let cancelled = false

        const update = (md: string) => {
            if (!cancelled) {
                setContent(md)
                setLoadedKey(key)
            }
        }

        const loader = docsModules[key]
        if (loader) {
            loader().then(update)
        } else {
            // Wrap in Promise.resolve so setState is always called asynchronously,
            // avoiding the "sync setState inside effect" lint warning
            Promise.resolve(NOT_FOUND_MD).then(update)
        }

        return () => { cancelled = true }
    }, [key])

    return (
        <DocsLayout>
            {isLoading ? (
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
