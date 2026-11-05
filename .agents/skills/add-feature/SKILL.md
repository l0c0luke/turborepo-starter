---
name: add-feature
description: Build a feature end to end in this monorepo — Drizzle schema + migration, shared Zod validators, a tRPC router with tests, a Next.js route with skeleton loading and optimistic mutations, an Expo screen with skeletons, i18n and analytics — and finish with every quality gate green. Use for any new feature, entity, page, screen or API endpoint.
---

# Add a feature (vertical slice)

Build features as complete vertical slices, modelled on the users-admin
reference feature. Read `AGENTS.md` first; this skill is the step-by-step.
**Done = `pnpm check` passes** and the checklist at the end is ticked.

Use `~/` for app-local imports, `@example-app/*` for packages, Zod from
`zod/v4`, `log` (never `console`) and the validated `env` (never `process.env`).
Before writing anything, look for code that already does it — reuse or extend
it rather than writing a second copy.

## 1. Schema + migration (`packages/db`)

Add tables to `packages/db/src/schema.ts` in the same style as
`auth-schema.ts` (callback columns; `casing: "snake_case"` maps names):

```ts
import { pgTable } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const workout = pgTable("workout", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: t.text().notNull(),
  durationMinutes: t.integer().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));
```

Then `pnpm db:generate` (commit `packages/db/drizzle/`) and `pnpm db:migrate`.
CI fails if the schema and migrations disagree. Never hand-edit generated SQL
unless you're adding a data migration, and never edit an applied migration.

## 2. Validators (`packages/validators`)

Shared input schemas — the same rules run in the form and on the server:

```ts
export const createWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().positive().max(24 * 60),
});
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
```

Export from `src/index.ts` and extend `src/index.test.ts`.

## 3. Router + tests (`packages/api`)

`packages/api/src/router/workout.ts` — use the narrowest procedure
(`protectedProcedure` for user data, `adminProcedure` for admin-only), and
**always scope queries to `ctx.session.user.id`** for user-owned data:

```ts
export const workoutRouter = {
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.workout.findMany({
      where: eq(workout.userId, ctx.session.user.id),
      orderBy: desc(workout.createdAt),
    }),
  ),
  create: protectedProcedure
    .input(createWorkoutSchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(workout)
        .values({ ...input, userId: ctx.session.user.id })
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return row;
    }),
} satisfies TRPCRouterRecord;
```

Register it in `packages/api/src/root.ts`. Throw `TRPCError` with a specific
code (never a bare `Error`). Then write `workout.test.ts` next to it (required
— `check:conventions` fails without it) using the **testing** skill:
unauthenticated → `UNAUTHORIZED`, another user's rows are invisible/
untouchable, invalid input → `BAD_REQUEST`, happy path, not found.

## 4. Web route (`apps/nextjs`)

Server component prefetches; a client component suspends; a skeleton shaped
like the content shows instantly. Copy `app/admin/`:

```
apps/nextjs/src/app/workouts/page.tsx      # prefetch + <HydrateClient> + <Suspense fallback={<WorkoutsSkeleton />}>
apps/nextjs/src/app/workouts/loading.tsx   # renders <WorkoutsSkeleton /> (required)
apps/nextjs/src/_components/workouts/WorkoutsContent.tsx   # "use client"; useSuspenseQuery
apps/nextjs/src/_components/workouts/WorkoutsSkeleton.tsx  # ~/_components/ui/skeleton, same layout as the content
```

- Gate the route in `src/proxy.ts` (matcher) and re-check the session in the
  page (see `app/admin/page.tsx`).
- **Mutations give instant feedback** — copy the optimistic pattern in
  `_components/admin/AdminContent.tsx`: `onMutate` (cancel queries, snapshot,
  `setQueryData`), `onError` (roll back + `toast.error`), `onSuccess`
  (`toast.success`), `onSettled` (invalidate). Where optimism doesn't fit
  (e.g. creating something that needs a server id), disable just that control
  and show a spinner in the button via `isPending`.
- Forms: `react-hook-form` + `zodResolver(createWorkoutSchema)` from
  `@example-app/validators`; show field errors inline.
- Every string through `next-intl` — add keys to **every** file in
  `src/languages/` (`check:conventions` compares them).
- Record meaningful product events with `trackEvent` from
  `@example-app/analytics` (e.g. `trackEvent("workout_created", { duration_minutes })`) — never PII.
- Keep heavy, interaction-only UI (editors, charts, big dialogs) out of the
  initial bundle: `next/dynamic` or `React.lazy` behind the interaction.
  `pnpm check:bundle` enforces the route budgets; if it fails, run the
  **next-bundle-optimizer** skill.
- Add the route to the navbar (`_components/navbar.tsx`).

## 5. Mobile screen (`apps/expo`)

`apps/expo/src/app/workouts.tsx`, registered in `src/app/_layout.tsx`, with
the custom `NavigationBar`:

```tsx
const { data, isPending, isError, refetch } = useQuery(
  trpc.workout.list.queryOptions(),
);
if (isPending) return <WorkoutsSkeleton />; // <Skeleton> rows shaped like the list — never a lone spinner
if (isError) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState … />;
```

Mutations use `useMutation(trpc.workout.create.mutationOptions({ … }))` with
the same optimistic/rollback pattern as web. Style with NativeWind classes or
`~/styles` tokens — no hardcoded colors/spacing. Lists use `FlatList` (see the
**vercel-react-native-skills** and **expo-data-fetching** skills).

## 6. Security pass

For anything touching auth, user data or new input, review the change with
the **security-audit** skill in guidance mode: authorization on every
procedure, ownership checks (no IDOR), input validation, nothing sensitive
logged or returned.

## 7. Finish

```bash
pnpm check        # lint, format, types, tests + coverage, deps, conventions, Expo
pnpm build        # optional locally; CI runs it with the bundle budget
```

Checklist:

- [ ] Migration generated and committed
- [ ] Validators + tests; router + `*.test.ts` (auth, ownership, validation, happy path)
- [ ] Web route: `loading.tsx` + Suspense skeleton; optimistic mutations with rollback + toasts
- [ ] Mobile screen: skeleton while pending, empty + error states
- [ ] Strings in every locale; analytics events via `trackEvent`
- [ ] Security pass done; bundle budget holds
- [ ] `pnpm check` green
