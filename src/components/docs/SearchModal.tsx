// src/components/docs/SearchModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import type { FuseResult } from 'fuse.js'
import searchEntries from 'virtual:search-index'
import type { SearchEntry } from '@/search/types'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUGGESTED_PATHS = [
  '/docs/backend/quick-start',
  '/docs/frontend/quick-start',
  '/docs/concepts',
  '/docs/tutorial',
]
const SUGGESTED: SearchEntry[] = searchEntries.filter((e) =>
  SUGGESTED_PATHS.includes(e.path)
)

const fuse = new Fuse(searchEntries, {
  keys: [
    { name: 'title',   weight: 0.5 },
    { name: 'section', weight: 0.1 },
    { name: 'excerpt', weight: 0.1 },
    { name: 'content', weight: 0.3 },
  ],
  threshold: 0.4,
  includeMatches: true,
  minMatchCharLength: 2,
})

// Applies Fuse match ranges to produce JSX with <strong> highlights.
// Ranges are into the full `text`; truncation happens after via CSS (line-clamp/truncate).
function highlightText(
  text: string,
  ranges: ReadonlyArray<readonly [number, number]> | undefined
): React.ReactNode {
  if (!ranges || ranges.length === 0) return text
  const parts: React.ReactNode[] = []
  let last = 0
  for (const [start, end] of ranges) {
    if (start > last) parts.push(text.slice(last, start))
    parts.push(
      <strong key={start} className="text-white font-semibold">
        {text.slice(start, end + 1)}
      </strong>
    )
    last = end + 1
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  const [results, setResults] = useState<FuseResult<SearchEntry>[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  // query is only set after debounce fires; inputValue drives the input element
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')

  // Open/close dialog — guard close() to avoid InvalidStateError when not open
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Sync onClose when dialog closes via native Esc
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  // Reset state on open; clear pending debounce timer on close
  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setQuery('')
      setResults([])
      setActiveIndex(0)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isOpen])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleInput = useCallback((value: string) => {
    setInputValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setQuery(value)
      if (value.length >= 2) {
        setResults(fuse.search(value, { limit: 8 }))
      } else {
        setResults([])
      }
      setActiveIndex(0)
    }, 150)
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  function selectEntry(entry: SearchEntry) {
    navigate(entry.path)
    onClose()
  }

  const showSuggested = query.length < 2
  const listLength = showSuggested ? SUGGESTED.length : results.length
  const activeItemId = (i: number) => `search-result-${i}`

  function handleKeyDown(e: React.KeyboardEvent) {
    const list = showSuggested ? SUGGESTED : results.map((r) => r.item)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && list[activeIndex]) {
      selectEntry(list[activeIndex])
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search documentation"
      aria-modal="true"
      onClick={handleBackdropClick}
      className="m-0 h-full w-full max-w-none max-h-none bg-transparent p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full w-full items-start justify-center pt-[15vh] px-4">
        <div
          className="w-full max-w-xl rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-slate-700/60 px-4">
            <svg
              className="h-4 w-4 shrink-0 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              role="combobox"
              aria-expanded={true}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={listLength > 0 ? activeItemId(activeIndex) : undefined}
              placeholder="Search docs..."
              value={inputValue}
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder-slate-500 outline-none"
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-500 sm:block">
              Esc
            </kbd>
          </div>

          {/* Results list */}
          <ul
            id="search-results"
            role="listbox"
            className="max-h-80 overflow-y-auto py-2"
          >
            {showSuggested && (
              <li className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                Suggested
              </li>
            )}
            {!showSuggested && results.length === 0 && query.length >= 2 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                No results for &ldquo;{inputValue}&rdquo;
              </li>
            )}
            {showSuggested
              ? SUGGESTED.map((entry, i) => (
                  <ResultItem
                    key={entry.id}
                    id={activeItemId(i)}
                    entry={entry}
                    isActive={i === activeIndex}
                    onSelect={() => selectEntry(entry)}
                    onHover={() => setActiveIndex(i)}
                    titleNode={entry.title}
                    excerptNode={entry.excerpt}
                  />
                ))
              : results.map((result, i) => {
                  const titleMatches = result.matches?.find(
                    (m) => m.key === 'title'
                  )?.indices
                  const excerptMatches = result.matches?.find(
                    (m) => m.key === 'excerpt'
                  )?.indices
                  return (
                    <ResultItem
                      key={result.item.id}
                      id={activeItemId(i)}
                      entry={result.item}
                      isActive={i === activeIndex}
                      onSelect={() => selectEntry(result.item)}
                      onHover={() => setActiveIndex(i)}
                      titleNode={highlightText(result.item.title, titleMatches)}
                      excerptNode={highlightText(
                        result.item.excerpt,
                        excerptMatches
                      )}
                    />
                  )
                })}
          </ul>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-slate-700/60 px-4 py-2 text-xs text-slate-600">
            <span>
              <kbd className="font-sans">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-sans">↵</kbd> open
            </span>
            <span>
              <kbd className="font-sans">Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </dialog>
  )
}

interface ResultItemProps {
  id: string
  entry: SearchEntry
  isActive: boolean
  onSelect: () => void
  onHover: () => void
  titleNode: React.ReactNode
  excerptNode: React.ReactNode
}

function ResultItem({
  id,
  entry,
  isActive,
  onSelect,
  onHover,
  titleNode,
  excerptNode,
}: ResultItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`mx-2 cursor-pointer rounded-lg px-3 py-2.5 transition-colors ${
        isActive ? 'bg-primary-500/15' : 'hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-slate-500">{entry.section}</span>
        <span className="text-xs text-slate-600">›</span>
        <span className="text-sm text-slate-200">{titleNode}</span>
      </div>
      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{excerptNode}</p>
    </li>
  )
}
