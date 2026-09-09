"use client";

import { useState, useEffect } from "react";
import { useSessionActivity } from "@/lib/context/SessionActivityContext";

export function ClearSessionButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { activities } = useSessionActivity();

  // Check localStorage only on client side (avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("saphoEngage.v1.drafts");
      if (stored) {
        const drafts = JSON.parse(stored);
        setHasDrafts(Object.keys(drafts).length > 0);
      }
    } catch {
      setHasDrafts(false);
    }
  }, []);

  const handleClear = () => {
    try {
      // Clear localStorage drafts
      localStorage.removeItem("saphoEngage.v1.drafts");

      // Clear activity log (if persisted)
      localStorage.removeItem("saphoEngage.v1.activities");

      // Show success and reload
      alert("Session data cleared! Page will reload.");
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear session data:", err);
      alert("Failed to clear session data. Check console for details.");
    }
  };

  const hasData = hasDrafts || activities.length > 0;

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted || !hasData) return null;

  return (
    <div className="relative">
      {showConfirm ? (
        <div className="flex items-center gap-2 bg-surface border border-red-200 rounded-sm px-3 py-1.5">
          <span className="font-sans text-xs text-red-700 uppercase tracking-tight">
            Clear all?
          </span>
          <button
            onClick={handleClear}
            className="font-sans text-xs font-semibold text-red-700 hover:text-red-900 uppercase tracking-tight"
          >
            Yes
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="font-sans text-xs text-muted hover:text-ink uppercase tracking-tight"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="font-sans text-xs text-muted hover:text-red-600 transition-colors uppercase tracking-tight"
          title="Clear all drafts and history"
        >
          Clear Session
        </button>
      )}
    </div>
  );
}
