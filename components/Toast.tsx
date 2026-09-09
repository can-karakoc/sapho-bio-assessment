"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  text: string;
}

let toastListeners: ((message: ToastMessage) => void)[] = [];

export function showToast(text: string) {
  const message: ToastMessage = {
    id: Math.random().toString(36).slice(2),
    text,
  };
  toastListeners.forEach((listener) => listener(message));
}

export function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (message: ToastMessage) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }, 3000);
    };

    toastListeners.push(listener);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="pointer-events-auto bg-ink text-surface border border-line px-4 py-3 rounded-sm shadow-lg font-mono text-xs uppercase tracking-tight animate-slide-up"
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
