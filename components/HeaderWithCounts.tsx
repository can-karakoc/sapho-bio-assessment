"use client";

import { Header } from "./Header";
import { useSessionActivity } from "@/lib/context/SessionActivityContext";

interface HeaderWithCountsProps {
  queueCount: number;
}

export function HeaderWithCounts({ queueCount }: HeaderWithCountsProps) {
  const { activities } = useSessionActivity();

  return (
    <Header
      queueCount={queueCount}
      historyCount={activities.length}
    />
  );
}
