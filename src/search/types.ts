export interface SearchEntry {
  id: string
  title: string
  path: string
  section: string
  excerpt: string  // first ~200 chars of plain text (for display)
  content: string  // full plain text stripped of markdown (for search only)
}
