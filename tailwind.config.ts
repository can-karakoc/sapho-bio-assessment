import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        highlight: {
          teal: "var(--highlight-teal)",
          mint: "var(--highlight-mint)",
        },
        status: {
          new: {
            fg: "var(--status-new-fg)",
            bg: "var(--status-new-bg)",
          },
          drafted: {
            fg: "var(--status-drafted-fg)",
            bg: "var(--status-drafted-bg)",
          },
          posted: {
            fg: "var(--status-posted-fg)",
            bg: "var(--status-posted-bg)",
          },
          skipped: {
            fg: "var(--status-skipped-fg)",
            bg: "var(--status-skipped-bg)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto-mono)", "monospace"],
        display: [
          "var(--font-aspekta)",
          "Aspekta",
          "Archivo",
          "Helvetica Neue",
          "sans-serif",
        ],
        numeric: ["var(--font-inter)", "sans-serif"],
        reading: ["var(--font-inter)", "sans-serif"], // Proportional reading font for post/draft text
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        sm: "var(--shadow-sm)",
      },
    },
  },
  plugins: [],
};

export default config;
