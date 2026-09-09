"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  queueCount: number;
  historyCount?: number;
}

export function Header({ queueCount, historyCount = 0 }: HeaderProps) {
  const pathname = usePathname();

  const isInfluencers =
    pathname === "/" || pathname.startsWith("/influencers");
  const isQueue = pathname === "/queue";
  const isHistory = pathname === "/history";

  return (
    <header className="sticky top-0 z-20 bg-bg border-b border-line backdrop-blur-none">
      <div className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] py-3 flex items-center justify-start gap-4 flex-wrap">
        {/* Brand - Aspekta/Roboto Mono wordmark in dark teal */}
        <Link
          href="/"
          className="font-display font-black text-base text-highlight-teal uppercase tracking-tight"
        >
          SAPHO ENGAGE
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] flex justify-start gap-0.5">
        <Link
          href="/"
          className={`font-sans font-medium text-xs px-3.5 py-3 border-b-2 uppercase tracking-tight transition-all ${
            isInfluencers
              ? "text-highlight-teal border-highlight-teal"
              : "text-muted border-transparent hover:text-ink"
          }`}
        >
          Influencers
        </Link>

        <Link
          href="/queue"
          className={`font-sans font-medium text-xs px-3.5 py-3 border-b-2 uppercase tracking-tight transition-all ${
            isQueue
              ? "text-highlight-teal border-highlight-teal"
              : "text-muted border-transparent hover:text-ink"
          }`}
        >
          Response Queue
          {queueCount > 0 && (
            <span className="font-sans text-[10px] bg-highlight-mint text-ink rounded-sm px-2 py-0.5 ml-1.5 font-semibold">
              {queueCount}
            </span>
          )}
        </Link>

        <Link
          href="/history"
          className={`font-sans font-medium text-xs px-3.5 py-3 border-b-2 uppercase tracking-tight transition-all ${
            isHistory
              ? "text-highlight-teal border-highlight-teal"
              : "text-muted border-transparent hover:text-ink"
          }`}
        >
          History
          {historyCount > 0 && (
            <span className="font-sans text-[10px] bg-highlight-mint text-ink rounded-sm px-2 py-0.5 ml-1.5 font-semibold">
              {historyCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
