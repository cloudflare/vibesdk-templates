# RedwoodSDK Template

## Use when:
- User wants a **server-first React application** with React Server Components
- User needs **D1 database** with direct SQL or Drizzle ORM
- User asks for a **full-stack app** on Cloudflare Workers
- User mentions **RedwoodSDK**, **rwsdk**, or **Redwood**
- User needs server-rendered pages with selective client interactivity
- User wants form-based mutations with server functions

## Avoid when:
- User wants a pure client-side SPA (use vite-reference instead)
- User wants Next.js-style file-based routing
- User needs real-time WebSocket features (use cfagents template)
- User is building a presentation or slide deck

## Built with:
- **Framework**: RedwoodSDK (rwsdk) — server-first React on Cloudflare Workers
- **Rendering**: React Server Components (default server, explicit "use client")
- **Routing**: defineApp() with explicit route definitions in worker.tsx
- **Database**: D1 (SQLite) via prepared statements or rwsdk/db with Kysely
- **Styling**: Tailwind CSS v4
- **Build**: Vite with rwsdk/vite + @cloudflare/vite-plugin
- **Runtime**: Cloudflare Workers with nodejs_compat
