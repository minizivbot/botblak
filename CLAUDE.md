# TradeZone — project notes for Claude

Next.js (App Router) + Prisma trading journal, deployed on Vercel.

## Deploying — ALWAYS push to main

**Every completed change must go live.** Vercel builds production from `main`
only. After verifying and committing, push BOTH the working branch and main:

```
git push -u origin <working-branch>
git push origin <working-branch>:main
```

Never leave finished work sitting only on a feature branch — the owner expects
every update to appear on the site without asking.

## Dual Prisma schemas

`prisma/schema.prisma` (SQLite, local dev) and `prisma/schema.postgres.prisma`
(Postgres, production) must stay identical except for the datasource. Mirror
every model change in both, then run `npx prisma db push && npx prisma generate`.
Avoid destructive column drops — production data survives deploys.

## Verify before pushing

`npx tsc --noEmit` and `npm run build` must pass, then exercise the changed
flows against `npm run dev` (curl + Playwright screenshots with
`/opt/pw-browsers/chromium-*/chrome-linux/chrome`). Clean up any test users or
rows created during verification before committing (the `demo` seed account
must stay unmodified: not admin, free plan, no leftover test data).

## Gotchas

- `src/middleware.ts` redirects unauthenticated requests: any new public/static
  path (crawler files, service worker, etc.) must be excluded in the matcher.
- `AUTH_SECRET` and the VAPID keys in production must never change — sessions,
  encrypted broker credentials and push subscriptions depend on them.
- Admins are always Pro (`isProUser`), so the owner can't lock themselves out.
