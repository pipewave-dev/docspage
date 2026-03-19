// vite-plugin-search-index.ts
import { readFileSync, readdirSync } from 'fs'
import { resolve, relative } from 'path'
import type { Plugin } from 'vite'
import { docsNavigation } from './src/constants/navigation'
import type { NavItem } from './src/constants/navigation'
import type { SearchEntry } from './src/search/types'

const VIRTUAL_ID = 'virtual:search-index'
const RESOLVED_ID = '\0' + VIRTUAL_ID

function findSection(entryPath: string): string {
  for (const section of docsNavigation) {
    for (const child of (section.children ?? []) as NavItem[]) {
      if (child.path === entryPath) return section.title
      for (const grandchild of (child.children ?? []) as NavItem[]) {
        if (grandchild.path === entryPath) return section.title
      }
    }
  }
  return 'Documentation'
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

function filePathToId(relativePath: string): string {
  return relativePath
    .replace(/^src\/docs\//, '')
    .replace(/\.md$/, '')
}

function idToRoute(id: string): string {
  if (id === 'index') return '/docs'
  return '/docs/' + id
}

function buildIndex(root: string): SearchEntry[] {
  const docsDir = resolve(root, 'src/docs')
  const entries: SearchEntry[] = []

  function walk(dir: string) {
    const items = readdirSync(dir, { withFileTypes: true })
    for (const item of items) {
      const full = resolve(dir, item.name)
      if (item.isDirectory()) {
        walk(full)
      } else if (item.name.endsWith('.md')) {
        const rel = relative(resolve(root), full).replace(/\\/g, '/')
        const id = filePathToId(rel)
        const path = idToRoute(id)
        const content = readFileSync(full, 'utf-8')
        const title = extractTitle(content)
        const plain = stripMarkdown(content)
        const excerpt = plain.slice(0, 200)
        const section = findSection(path)
        entries.push({ id, title, path, section, excerpt, content: plain })
      }
    }
  }

  walk(docsDir)
  return entries
}

export default function searchIndexPlugin(): Plugin {
  let root = ''

  return {
    name: 'search-index',

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const entries = buildIndex(root)
      console.log(`[search-index] Built: ${entries.length} entries`)
      return `export default ${JSON.stringify(entries)}`
    },

    hotUpdate({ file, server }) {
      if (file.endsWith('.md') && file.includes('/docs/')) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        // Send full-reload so browser picks up the new index
        server.ws.send({ type: 'full-reload' })
        console.log('[search-index] Rebuilt on HMR')
      }
    },
  }
}
