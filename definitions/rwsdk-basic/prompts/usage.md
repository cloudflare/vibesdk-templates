# RedwoodSDK Template Usage

## Overview
Server-first React framework on Cloudflare Workers using React Server Components. All components are server components by default — use `"use client"` only for interactive components.

## Tech
- RedwoodSDK (rwsdk), React 19, Tailwind CSS v4, D1 (SQLite), TypeScript, Vite

## File Structure
```
src/
├── worker.tsx          # Entry point: defineApp() with all routes
├── client.tsx          # Client hydration: initClient()
└── app/
    ├── Document.tsx    # HTML shell (must include client.tsx script)
    ├── styles.css      # Tailwind: @import "tailwindcss"
    ├── pages/          # Page components (server components by default)
    ├── components/     # Shared components ("use client" for interactive ones)
    └── functions.ts    # Server functions ("use server" for mutations)
migrations/
└── 0001_init.sql       # D1 schema
```

## Development Restrictions

### CRITICAL Rules
- **ALL components are server components by default** — they run on the server
- **`"use client"` goes at the FILE level** — the entire file becomes a client module
- **`"use server"` goes at the FILE level** — marks server functions callable from client
- **Routes are defined ONLY in `src/worker.tsx`** using `defineApp()`
- **Use `import { env } from "cloudflare:workers"`** — NEVER `process.env`
- **Vite config must be `vite.config.mts`** (not `.ts`)
- **Document MUST include** `<script>import("/src/client.tsx")</script>`
- **CSS imports use `?url` suffix**: `import styles from "./styles.css?url"`
- **Tailwind requires `environments: { ssr: {} }`** in vite.config.mts
- **Generate timestamps in code** with `new Date().toISOString()` — NOT SQL defaults

### CANNOT Modify
- `vite.config.mts` structure (plugins order matters)
- `src/client.tsx` (must be exactly `initClient()`)

## Routing
```typescript
import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

export default defineApp([
  render(Document, [
    route("/", HomePage),
    route("/posts/:id", PostPage),        // params.id available
    prefix("/admin", [
      route("/", AdminDashboard),
    ]),
  ]),
]);
```

### Route with inline data fetching:
```typescript
route("/posts/:id", async ({ params }) => {
  const post = await getPost(params.id);
  if (!post) return new Response("Not found", { status: 404 });
  return <PostPage post={post} />;
})
```

### API routes (HTTP method routing):
```typescript
route("/api/items", {
  get: () => Response.json(items),
  post: async ({ request }) => {
    const body = await request.json();
    return Response.json(newItem, { status: 201 });
  },
})
```

## Server Components (default)
```typescript
// No directive needed — server by default
import { env } from "cloudflare:workers";

export async function TodoList() {
  const { results } = await env.DB.prepare("SELECT * FROM todos").all();
  return <ul>{results.map((t: any) => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

## Client Components
```typescript
"use client";
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

## Server Functions (mutations)
```typescript
// functions.ts
"use server";
import { env } from "cloudflare:workers";

export async function addTodo(formData: FormData) {
  const title = formData.get("title") as string;
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO todos (id, title, completed, created_at) VALUES (?, ?, 0, ?)")
    .bind(id, title, new Date().toISOString()).run();
}
```

Client components call via form actions:
```typescript
"use client";
import { addTodo } from "./functions";

export function AddTodoForm() {
  return (
    <form action={addTodo}>
      <input type="text" name="title" required />
      <button type="submit">Add</button>
    </form>
  );
}
```

## Database (D1)
- Schema in `migrations/0001_init.sql`
- Access via `env.DB.prepare("SQL").bind(values).run()`
- Read: `.all()` returns `{ results }`, `.first()` returns single row
- Write: `.run()` for INSERT/UPDATE/DELETE
- Binding name: `DB` (configured in wrangler.jsonc)

## Styling
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Import in Document: `import styles from "./styles.css?url"`
- Use Tailwind utility classes directly in JSX
- Responsive, accessible design preferred

## Bindings
- `DB` — D1 database for persistent storage
- `ASSETS` — Static asset serving
- Access via `import { env } from "cloudflare:workers"`
