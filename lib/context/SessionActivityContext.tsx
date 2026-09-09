"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ActivityEntry {
  id: string;
  postId: string;
  influencerId: string;
  influencerName: string;
  postSnippet: string;
  goal: "comment" | "dm";
  model: string;
  text: string;
  action: "generated" | "regenerated" | "posted" | "copied" | "skipped";
  outcome?: {
    likes: number;
    comments: number;
  };
  createdAt: string;
}

interface SessionActivityContextValue {
  activities: ActivityEntry[];
  addActivity: (entry: ActivityEntry) => void;
  updateActivityOutcome: (id: string, outcome: { likes: number; comments: number }) => void;
}

const SessionActivityContext = createContext<SessionActivityContextValue | undefined>(undefined);

const ACTIVITIES_KEY = "saphoEngage.v1.activities";

export function SessionActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load activities from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivities(parsed);
      }
    } catch (err) {
      console.warn("Failed to load activities from localStorage:", err);
    }
    setMounted(true);
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (!mounted) return; // Don't save on initial mount
    try {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (err) {
      console.warn("Failed to save activities to localStorage:", err);
    }
  }, [activities, mounted]);

  const addActivity = (entry: ActivityEntry) => {
    setActivities((prev) => [entry, ...prev]); // newest first
  };

  const updateActivityOutcome = (id: string, outcome: { likes: number; comments: number }) => {
    setActivities((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, outcome } : entry
      )
    );
  };

  return (
    <SessionActivityContext.Provider value={{ activities, addActivity, updateActivityOutcome }}>
      {children}
    </SessionActivityContext.Provider>
  );
}

export function useSessionActivity() {
  const context = useContext(SessionActivityContext);
  if (!context) {
    throw new Error("useSessionActivity must be used within SessionActivityProvider");
  }
  return context;
}
