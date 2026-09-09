"use client";

export function InfluencerActions() {
  const handleRecompute = () => {
    alert('Recompute would recalculate all influencer scores based on latest engagement data.');
  };

  const handleAdd = () => {
    alert('Add Influencer: This would open a dialog to manually add a new influencer to track.');
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Secondary button */}
      <button
        onClick={handleRecompute}
        className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3.5 py-2.5 rounded-sm inline-flex items-center gap-1.5 hover:border-highlight-teal transition-all uppercase tracking-tight"
      >
        ↻ Recompute
      </button>
      {/* Primary button - dark fill */}
      <button
        onClick={handleAdd}
        className="font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-3.5 py-2.5 rounded-sm inline-flex items-center gap-1.5 hover:bg-highlight-teal/90 transition-all uppercase tracking-tight"
      >
        + Add
      </button>
    </div>
  );
}
