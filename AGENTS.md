# Claude Guidelines for tools.kabilan108.com

## Build & Run Commands
- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun biome check .` - Run linter
- `bun biome check --write .` - Fix lint/format issues

## Code Style Guidelines
- **Formatting**: Use Biome (88 char line width, 2 space indent, single quotes)
- **Framework**: Next.js 15+ with App Router, TypeScript, Tailwind CSS v4
- **Components**: React Server Components by default, `'use client'` only when needed
- **Auth**: WorkOS AuthKit (`@workos-inc/authkit-nextjs`)
- **Logging**: pino for structured server-side logging
- **Imports**: Use `@/*` alias for `src/` directory

## Project Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/app/tools/[slug]/` - Individual tool pages
- `src/lib/tools.ts` - Tool registry (add new tools here)
- `src/lib/logger.ts` - Structured logger
- `src/components/` - Shared React components
- `src/middleware.ts` - WorkOS auth middleware

## Adding a New Tool
1. Add entry to `src/lib/tools.ts` registry array
2. Create `src/app/tools/[slug]/page.tsx` and client component
3. If auth-required, update `unauthenticatedPaths` in `src/middleware.ts`

Run Biome before committing changes.

# Non-obvious learnings

## Next.js 16 middleware location
When using a `src/` directory, `middleware.ts` MUST be at `src/middleware.ts`, not the project root. A root-level middleware will compile without errors but silently never execute. The `withAuth()` error "not covered by the AuthKit middleware" means the middleware isn't running at all — not that the matcher config is wrong.

## Next.js 16 middleware deprecation
Next.js 16 emits a warning that the `middleware` file convention is deprecated in favor of `proxy`. It still works from `src/middleware.ts` as of 16.1.6.

## authkit-nextjs header mechanism
`authkitMiddleware` proves it ran by setting `x-workos-middleware: true` as a forwarded request header via `NextResponse.next({ request: { headers } })`. If you see the "not covered" error, the middleware function itself is not being invoked — debug middleware execution, not the matcher pattern.
