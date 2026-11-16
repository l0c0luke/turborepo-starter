"use client";

import type { ReactNode, Ref } from "react";
import { useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { ListPage, SortDirection } from "@example-app/validators";
import { PAGE_SIZES } from "@example-app/validators";

import { Button } from "~/_components/ui/button";
import { Input } from "~/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/_components/ui/select";
import { Skeleton } from "~/_components/ui/skeleton";
import { TableHead } from "~/_components/ui/table";
import { cn } from "~/lib/utils";

/**
 * Building blocks for server-side tables (AGENTS.md → UX → Data tables).
 * State comes from `useListParams`; see `AdminContent` for the full table.
 */

/** Search box; shows a spinner while the matching page loads. */
export function DataTableSearch({
  value,
  onChange,
  placeholder,
  isUpdating,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isUpdating: boolean;
  /** Lets a page command focus the box. */
  ref?: Ref<HTMLInputElement>;
}) {
  const t = useTranslations("dataTable");
  const Icon = isUpdating ? LoaderCircle : Search;
  return (
    <div className="relative w-full max-w-sm">
      <Icon
        aria-hidden
        className={cn(
          "text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2",
          isUpdating && "animate-spin",
        )}
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("search")}
        aria-label={placeholder ?? t("search")}
        className="pl-9"
      />
    </div>
  );
}

/** A header cell that sorts the table on the server when clicked. */
export function SortableHead<TSort extends string>({
  column,
  sort,
  dir,
  onSort,
  children,
  className,
}: {
  column: TSort;
  sort: TSort;
  dir: SortDirection;
  onSort: (column: TSort) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sort === column;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (dir === "asc" ? "ascending" : "descending") : undefined
      }
    >
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => onSort(column)}
      >
        {children}
        <Icon
          aria-hidden
          className={cn("size-3.5", !active && "text-muted-foreground")}
        />
      </Button>
    </TableHead>
  );
}

/**
 * "1–20 of 134", page size and previous/next. Hovering a button prefetches
 * that page so the click renders instantly. If the current page no longer
 * exists (the last row on it was deleted), it moves to the last page.
 */
export function DataTablePagination({
  page,
  onPageChange,
  onPageSizeChange,
  onPrefetch,
}: {
  page: ListPage<unknown>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onPrefetch?: (page: number) => void;
}) {
  const t = useTranslations("dataTable");
  const { total, pageSize, pageCount } = page;
  const current = page.page;

  useEffect(() => {
    if (current > pageCount) onPageChange(pageCount);
  }, [current, pageCount, onPageChange]);

  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const go = (target: number) => ({
    onClick: () => onPageChange(target),
    onPointerEnter: () => onPrefetch?.(target),
    onFocus: () => onPrefetch?.(target),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <p className="text-muted-foreground" aria-live="polite">
        {t("range", { from, to, total })}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("rowsPerPage")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" aria-label={t("rowsPerPage")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">
          {t("pageOf", { page: current, pageCount })}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={current <= 1}
            aria-label={t("previous")}
            {...go(current - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={current >= pageCount}
            aria-label={t("next")}
            {...go(current + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the search box and pagination bar, for a table's loading state. */
export function DataTableSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full max-w-sm" />
      {children}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
