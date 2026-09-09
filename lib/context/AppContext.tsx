"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type BrandVoice = "peer-expert" | "warm" | "concise";

interface AppContextValue {
  brandVoice: BrandVoice;
  setBrandVoice: (voice: BrandVoice) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [brandVoice, setBrandVoice] = useState<BrandVoice>("peer-expert");

  return (
    <AppContext.Provider value={{ brandVoice, setBrandVoice }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
