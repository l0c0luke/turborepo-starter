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

Lists take the shared paging/search/sort input — never invent your own:

```ts
export const listWorkoutsSchema = listQuerySchema(["createdAt", "name"]); // first = default sort
```

Export from `src/index.ts` and extend `src/index.test.ts`.

## 3. Router + tests (`packages/api`)

`packages/api/src/router/workout.ts` — use the narrowest procedure
(`protectedProcedure` for user data, `adminProcedure` for admin-only), and
**always scope queries to `ctx.session.user.id`** for user-owned data:

```ts
const SORT_COLUMNS = { createdAt: workout.createdAt, name: workout.name };

export const workoutRouter = {
  // Lists are paged, searched and sorted in SQL (AGENTS.md → UX → Data tables).
  list: protectedProcedure
    .input(listWorkoutsSchema)
    .query(({ ctx, input }) => {
      const where = and(
        eq(workout.userId, ctx.session.user.id),
        searchAny(input.search, [workout.name]),
      );
      return paginate(input, {
        rows: (limit, offset) =>
          ctx.db.query.workout.findMany({
            where,
            orderBy: [sortBy(SORT_COLUMNS[input.sort], input.dir), asc(workout.id)],
            limit,
            offset,
          }),
        count: () => ctx.db.$count(workout, where),
      });
    }),
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
untouchable, invalid input → `BAD_REQUEST`, happy path, not found — and for
lists: search, sort and a second page (see `listUsers` in `admin.test.ts`).
`check:conventions` (server-pagination) fails any `findMany` /
`select().from()` without a `limit`.

## 4. Web route (`apps/nextjs`)

Server component prefetches; a client component suspends; a skeleton shaped
like the content shows instantly. Copy `app/admin/`:

```
apps/nextjs/src/app/workouts/page.tsx      # prefetch + <HydrateClient> + <Suspense fallback={<WorkoutsSkeleton />}>
apps/nextjs/src/app/workouts/loading.tsx   # renders <WorkoutsSkeleton /> (required)
apps/nextjs/src/_components/workouts/WorkoutsContent.tsx   # "use client"; useSuspenseQuery
apps/nextjs/src/_components/workouts/WorkoutsSkeleton.tsx  # ~/_components/ui/skeleton, same layout as the content
```

- **Tables are server-side** — copy `AdminContent`: `useListParams(listWorkoutsSchema)`
  for URL-backed page/search/sort, `useSuspenseQuery(trpc.workout.list.queryOptions(table.query))`,
  `DataTableSearch`, `SortableHead`, `DataTablePagination` (with `onPrefetch`)
  from `~/_components/data-table/DataTable`, the table dimmed while
  `table.isUpdating`, and in `page.tsx`
  `prefetch(trpc.workout.list.queryOptions(listInputFromSearchParams(listWorkoutsSchema, await searchParams)))`.
  The skeleton wraps its rows in `DataTableSkeleton`.
- Gate the route in `src/proxy.ts` (matcher) and re-check the session in the
  page (see `app/admin/page.tsx`).
- **Mutations give instant feedback** — copy the optimistic pattern in
  `_components/admin/AdminContent.tsx`: `onMutate` (cancel queries, snapshot,
  `setQueryData` — for paged lists `useOptimisticPages(trpc.….pathFilter())`
  does this across every cached page), `onError` (roll back + `toast.error`),
  `onSuccess` (`toast.success`), `onSettled` (invalidate). Where optimism doesn't fit
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
const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery(
    trpc.workout.list.infiniteQueryOptions(
      { search },
      { getNextPageParam: (page) => page.nextCursor },
    ),
  );
if (isPending) return <WorkoutsSkeleton />; // <Skeleton> rows shaped like the list — never a lone spinner
if (isError) return <ErrorState onRetry={refetch} />;
const items = data.pages.flatMap((page) => page.items);
if (items.length === 0) return <EmptyState … />;
// <FlatList data={items} onEndReached={() => hasNextPage && fetchNextPage()}
//   ListFooterComponent={isFetchingNextPage ? <Skeleton … /> : null} />
```

Search on mobile is server-side too: debounce the text into `search`
(`check:conventions` list-pagination fails a `FlatList` of fetched rows that
isn't an infinite query).

Mutations use `useMutation(trpc.workout.create.mutationOptions({ … }))` with
the same optimistic/rollback pattern as web. Style with NativeWind classes or
`~/styles` tokens — no hardcoded colors/spacing. Lists use `FlatList` (see the
**vercel-react-native-skills** and **expo-data-fetching** skills).

## 6. Security pass

For anything touching auth, user data or new input, review the change with
the **security-audit** skill in guidance mode: authorization on every
procedure, ownership checks (no IDOR), input validation, nothing sensitive
logged or returned.

## 7. Cloud resources

If the feature needs anything in a cloud account (a bucket for uploads, a
queue, an email domain, a DNS record), add it with Terraform following the
**infrastructure** skill (module + test, wired into each `infra/envs/*`).
Never create it in a console. Pass its outputs to the app as validated env vars.

## 8. Finish

```bash
pnpm check        # lint, format, types, tests + coverage, deps, conventions, Expo
pnpm build        # optional locally; CI runs it with the bundle budget
```

Checklist:

- [ ] Migration generated and committed
- [ ] Validators + tests; router + `*.test.ts` (auth, ownership, validation, happy path)
- [ ] Web route: `loading.tsx` + Suspense skeleton; optimistic mutations with rollback + toasts
- [ ] Lists/tables: `listQuerySchema` + `paginate()` on the server; web `useListParams` + data-table parts; mobile `useInfiniteQuery`
- [ ] Mobile screen: skeleton while pending, empty + error states
- [ ] Strings in every locale; analytics events via `trackEvent`
- [ ] Security pass done; bundle budget holds
- [ ] Cloud resources (if any) in Terraform with tests; `pnpm check:infra` green
- [ ] `pnpm check` green
