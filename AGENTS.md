# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` App Router routes like `page.tsx`, `layout.tsx`, `login/`, `dashboard/`, and `auth/`.
- `src/lib/supabase/` Supabase client helpers and middleware utilities.
- `src/components/` shared UI components (currently empty).
- `src/types/` shared TypeScript types.
- `src/middleware.ts` route protection middleware.
- Root configs: `next.config.js`, `tailwind.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the dev server at `http://localhost:3000`.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs ESLint via Next.js.

## Coding Style & Naming Conventions
- TypeScript with React and the Next.js App Router.
- Match existing style: 2-space indentation, single quotes, no semicolons.
- Use the `@/` alias for imports from `src` (example: `@/lib/supabase/server`).
- Route files follow Next.js names like `page.tsx` and `layout.tsx`.
- Name new components in `PascalCase.tsx`.

## Testing Guidelines
- No automated test framework or `npm test` script is configured yet.
- If you add tests, keep them near the feature or under `src/__tests__/` and use `*.test.ts` or `*.test.tsx`.
- Add the test command to `package.json` and document it here.

## Commit & Pull Request Guidelines
- Git history currently contains only `Initial commit`, so no established convention.
- Use short, imperative commit subjects and include a scope when helpful (example: `auth: handle refresh token`).
- PRs should describe intent and impact, link issues, list config or env var changes, and include screenshots for UI updates.

## Security & Configuration
- Local secrets live in `.env.local`. Required keys: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Do not commit `.env.local`. Keep Supabase RLS policies enabled and verify OAuth redirect URLs.
