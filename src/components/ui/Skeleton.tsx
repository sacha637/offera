import type { HTMLAttributes } from "react";

/** Bloc de base pour loaders type “app” (pulse discret). */
export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/90 dark:bg-slate-700/80 ${className}`}
      aria-hidden
      {...props}
    />
  );
}

/** Rangée type “top favoris” (image + textes). */
export function OfferRowSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-20 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <Skeleton className="h-4 w-[85%] max-w-xs" />
        <Skeleton className="h-3 w-[55%] max-w-[10rem]" />
      </div>
    </div>
  );
}

/** Carte offre (grille catalogue / accueil). */
export function OfferCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/60">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}
