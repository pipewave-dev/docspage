/// <reference types="vite/client" />

declare module 'virtual:search-index' {
  // import() in a .d.ts ambient declaration is always type-only — verbatimModuleSyntax does not apply to .d.ts files
  const entries: import('./search/types').SearchEntry[]
  export default entries
}
