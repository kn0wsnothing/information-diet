# Information Diet

A Next.js full-stack application for managing and analyzing reading habits and content sources.

## Core Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production start**: `npm run start`
- **Lint**: `npm run lint`
- **Database migrations**: `npx prisma migrate dev --name <migration_name>`
- **View database**: `npx prisma studio`
- **Reset database** (dev only): `npx prisma migrate reset`

## Project Layout

```
src/
  ├── app/              → Next.js App Router pages and API routes
  ├── components/       → Reusable React components
  └── lib/              → Utilities, database clients, helpers
prisma/                 → Database schema and migrations
public/                 → Static assets
scripts/                → Utility scripts
```

## Development Patterns & Conventions

### Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Prisma ORM with SQLite (dev), PostgreSQL (production)
- **Auth**: Clerk (with middleware in `src/middleware.ts`)
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **UI**: React 19, lucide-react for icons
- **Type Safety**: TypeScript strict mode

### Code Style
- TypeScript strict mode required
- Use functional React components
- Prefer Zod for API request/response validation
- Clerk auth handles protected routes via middleware
- ESLint for linting (see `eslint.config.mjs`)

### Database
- Prisma schema lives in `prisma/schema.prisma`
- SQLite for development (`dev.db`)
- Always create migrations before schema changes: `npx prisma migrate dev --name <name>`
- Main tables: `User`, `Source`, `Item`, `ReadingSession`

### API Routes
- Located in `src/app/api/`
- Use Next.js API route conventions (file-based routing)
- Validate requests with Zod before processing
- Return JSON responses

### Authentication
- Clerk middleware enforces auth for protected routes
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` required in `.env.local`
- See `src/middleware.ts` for route protection config

## Environment Setup

Required variables in `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=file:./dev.db  (dev only; use PostgreSQL for production)
```

Reference `.env.example` for full list. Never commit `.env.local`.

## Git Workflows

1. Branch from `main` with descriptive name: `feature/<slug>` or `bugfix/<slug>`
2. Run `npm run lint` locally before committing
3. Use atomic commits with clear messages: `feat: ...`, `fix: ...`, `docs: ...`
4. No force pushes to `main`; use `git push --force-with-lease` only on feature branches

## Testing & Verification

Before submitting PRs:
- Lint check: `npm run lint` (must pass)
- Build: `npm run build` (must succeed)
- Manual testing: start dev server and verify functionality
- Database state: verify migrations run cleanly from scratch

## Third-Party Integrations

- **Clerk**: Authentication and user management
- **Readwise API** (optional): For importing reading highlights
- **RSS Parser**: For RSS feed parsing (`rss-parser` package)
- **CSV Import**: Goodreads/StoryGraph CSV file support

## Gotchas

- **Database locks** (SQLite): Delete `dev.db` and re-run `npx prisma db push` if you hit lock errors
- **Prisma generation**: Always run `npx prisma generate` after pulling schema changes
- **Auth key mismatch**: `NEXT_PUBLIC_APP_URL` must match your current domain (localhost:3000 in dev)
- **TypeScript types**: Regenerate types after schema changes with `npx prisma generate`

## Related Docs

- [USER_JOURNEY.md](USER_JOURNEY.md) - Feature overview and user flows
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [Clerk Docs](https://clerk.com/docs) - Authentication reference
- [Next.js Docs](https://nextjs.org/docs) - Framework documentation
- [Prisma Docs](https://www.prisma.io/docs) - ORM reference
