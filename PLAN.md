# Pipewave Landing Page - Project Plan

## Mục tiêu
Tạo landing page + documentation site bằng React TypeScript để quảng bá Pipewave - một WebSocket module cho Go backend và TypeScript frontend.

---

## 1. Tech Stack

| Layer | Choice | Lý do |
|-------|--------|-------|
| Framework | React 19 + TypeScript | Cùng ecosystem với FeModule |
| Build | Vite | Nhanh, nhẹ |
| Routing | React Router v7 | SPA navigation giữa landing/docs |
| Styling | Tailwind CSS 4 | Utility-first, dễ tạo dark theme |
| Syntax Highlight | Shiki | Highlight Go + TypeScript code blocks |
| Animation | Framer Motion | Smooth scroll animations |
| Markdown render | react-markdown + remark-gfm | Render markdown docs |
| Deploy | Static build (Vite) | Host trên bất kỳ CDN/S3 |

---

## 2. Cấu trúc thư mục

```
docpages/
├── public/
│   └── og-image.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                  # Tailwind base + custom styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Top navigation + mobile menu
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx         # Wrapper with Navbar + Footer
│   │   ├── landing/
│   │   │   ├── Hero.tsx           # Headline + CTA + animated demo
│   │   │   ├── Features.tsx       # Feature cards grid
│   │   │   ├── Architecture.tsx   # Architecture diagram (SVG/Mermaid)
│   │   │   ├── CodePreview.tsx    # Side-by-side Backend/Frontend code
│   │   │   ├── HowItWorks.tsx     # Step-by-step flow
│   │   │   └── Roadmap.tsx        # Future development timeline
│   │   ├── docs/
│   │   │   ├── DocsSidebar.tsx    # Sidebar navigation
│   │   │   ├── DocsLayout.tsx     # Sidebar + content wrapper
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   └── CodeBlock.tsx      # Syntax-highlighted code block
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       └── Card.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── DocsPage.tsx           # Renders markdown from route param
│   │   └── NotFound.tsx
│   ├── docs/                      # Markdown content (copy từ project-docs + mở rộng)
│   │   ├── index.md               # Getting Started
│   │   ├── architecture.md
│   │   ├── backend/
│   │   │   ├── quick-start.md
│   │   │   ├── configuration.md
│   │   │   ├── inspect-fn.md
│   │   │   ├── handler-fn.md
│   │   │   ├── module-api.md
│   │   │   └── scaling.md
│   │   └── frontend/
│   │       ├── quick-start.md
│   │       ├── pipewave-provider.md
│   │       ├── use-pipewave-hook.md
│   │       ├── binary-protocol.md
│   │       └── long-polling-fallback.md
│   └── constants/
│       └── navigation.ts          # Sidebar menu structure
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 3. Trang Landing Page - Sections

### 3.1 Hero Section
- **Headline**: "Pipewave — Real-time WebSocket, Simplified"
- **Subtitle**: Mô tả ngắn gọn: Go module + TypeScript SDK, binary protocol, user-based messaging
- **CTA buttons**: "Get Started" → docs, "View on Git" → repo
- **Visual**: Animated diagram thể hiện message flow client ↔ server

### 3.2 Features Grid (6 cards)
1. **Multiplexed Messages** — type + binary data trên cùng 1 connection, event-driven pattern
2. **User-Based Messaging** — SendToUser thay vì SendToConnection, quản lý theo user identity
3. **Scalable by Design** — PubSub broadcast, no sticky session, multi-VM/K8s ready
4. **High Performance** — Binary frames (MessagePack), Go concurrency, kqueue/netpoll cho idle sockets
5. **Built-in Heartbeat** — FeModule tự quản lý heartbeat, auto-reconnect với exponential backoff
6. **React Hook Ready** — `usePipewave()` hook, WebSocket status reactive, message handler per type

### 3.3 How It Works (Step-by-step)
Minh hoạ flow 4 bước:
1. Backend: Import module, provide `InspectToken` + `HandleMessage`
2. Frontend: Wrap app với `<PipewaveProvider>`, config endpoint + auth
3. Hook: `usePipewave({ "MSG_TYPE": handler })` — subscribe message types
4. Server Push: `ws.SendToUser(userID, type, data)` — gửi realtime đến user

### 3.4 Code Preview
Side-by-side code panels:
- **Left**: Go backend setup (playground/main.go simplified)
- **Right**: React frontend setup (Example.tsx simplified)
Có syntax highlighting, copy button.

### 3.5 Architecture Diagram
SVG diagram thể hiện:
- Multiple backend instances
- PubSub layer (Valkey)
- DynamoDB (connection tracking)
- Client connections (WS + LP fallback)
- Token exchange flow

### 3.6 Roadmap
Timeline cards:
- ✅ Core WebSocket module
- ✅ Long Polling fallback
- ✅ React hook support
- 🔜 More database adapters
- 🔜 More PubSub adapters
- 🔜 Multi-language API exposure
- 🔜 Metrics & Observability

---

## 4. Documentation Pages

### 4.1 Sidebar Navigation Structure

```
Getting Started
├── Overview
├── Architecture
Backend Integration
├── Quick Start
├── Configuration (config.yaml)
├── InspectToken Function
├── HandleMessage Function
├── Services API (SendToUser, Monitoring)
├── Scaling & Deployment
Frontend Integration
├── Quick Start
├── PipewaveProvider
├── usePipewave Hook
├── Binary Protocol (MessagePack)
├── Long Polling Fallback
```

### 4.2 Documentation Content
- Mỗi page là 1 markdown file trong `src/docs/`
- Render bằng `react-markdown` + `remark-gfm`
- Code blocks highlight bằng Shiki (Go + TypeScript)
- Mỗi page có "Edit on Git" link

---

## 5. Thứ tự thực hiện

### Phase 1: Project Setup
- [ ] Init Vite + React + TypeScript project
- [ ] Install dependencies (tailwind, react-router, framer-motion, shiki, react-markdown)
- [ ] Setup Tailwind config với dark theme
- [ ] Setup routing (/ → landing, /docs/* → docs)

### Phase 2: Layout & Navigation
- [ ] Navbar component (logo, links, mobile menu)
- [ ] Footer component
- [ ] Docs sidebar + layout

### Phase 3: Landing Page
- [ ] Hero section
- [ ] Features grid
- [ ] How It Works section
- [ ] Code Preview section (Backend/Frontend tabs)
- [ ] Architecture diagram
- [ ] Roadmap section

### Phase 4: Documentation Content
- [ ] Viết markdown docs (dựa trên project-docs + source code đã đọc)
- [ ] Markdown renderer + code block highlighting
- [ ] Docs navigation & routing

### Phase 5: Polish
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Scroll animations (Framer Motion)
- [ ] SEO meta tags
- [ ] OG image

---

## 6. Design Direction
- **Theme**: Dark-first (dev-friendly), với light mode toggle
- **Color palette**: Deep navy/slate background, cyan/teal accent cho highlights
- **Typography**: Inter/JetBrains Mono cho code
- **Style**: Clean, minimal, technical — tương tự Tailwind docs / Supabase landing
