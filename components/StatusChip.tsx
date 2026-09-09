type Status = "new" | "drafted" | "posted" | "skipped";

interface StatusChipProps {
  status: Status;
}

const statusStyles = {
  new: "text-ink bg-highlight-mint font-bold", // Mint background for NEW
  drafted: "text-status-drafted-fg bg-status-drafted-bg",
  posted: "text-status-posted-fg bg-status-posted-bg",
  skipped: "text-status-skipped-fg bg-status-skipped-bg",
};

const statusLabels = {
  new: "NEW",
  drafted: "DRAFTED",
  posted: "POSTED",
  skipped: "SKIPPED",
};

export function StatusChip({ status }: StatusChipProps) {
  const normalizedStatus = status.toLowerCase() as Status;

  return (
    <span
      className={`font-sans text-[10px] tracking-tight uppercase px-2 py-1 rounded-sm whitespace-nowrap ${statusStyles[normalizedStatus]}`}
    >
      {statusLabels[normalizedStatus]}
    </span>
  );
}
