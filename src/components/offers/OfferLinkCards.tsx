"use client";

import type { OfferLinkItem, OfferLinkType } from "../../lib/offerLinks";
import { linkCtaLabel, linkTypeIcon } from "../../lib/offerLinks";

type Props = {
  links: OfferLinkItem[];
  expired?: boolean;
};

export function OfferLinkCards({ links, expired }: Props) {
  if (links.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Aucun lien renseigné pour cette offre.
      </p>
    );
  }

  const cardClass = `group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm ring-1 ring-slate-100/80 transition duration-200 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md hover:ring-emerald-100 dark:hover:border-emerald-500/50 dark:hover:ring-emerald-950/40`;

  return (
    <div className="grid gap-3">
      {links.map((l, idx) => {
        const inner = (
          <>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none" aria-hidden>
                {linkTypeIcon(l.type as OfferLinkType | undefined)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold tracking-tight text-slate-900 dark:text-slate-100">{l.title}</p>
                {l.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{l.description}</p>
                ) : null}
              </div>
            </div>
            <span className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:bg-emerald-500 sm:w-auto sm:self-start">
              {linkCtaLabel(l.type as OfferLinkType | undefined)}
            </span>
          </>
        );

        if (expired) {
          return (
            <div
              key={`${l.url}-${idx}`}
              className={`${cardClass} pointer-events-none opacity-55`}
            >
              {inner}
            </div>
          );
        }

        return (
          <a key={`${l.url}-${idx}`} href={l.url} target="_blank" rel="noreferrer" className={cardClass}>
            {inner}
          </a>
        );
      })}
    </div>
  );
}
