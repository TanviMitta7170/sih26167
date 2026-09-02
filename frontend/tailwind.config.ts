import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#ffffff",   // White base surface
          secondary: "#f8fafc", // Light gray slate surface
          tertiary: "#f1f5f9",  // Slightly darker gray/slate surface
        },
        border: {
          subtle: "#e2e8f0",    // Subtle light slate border
          muted: "#cbd5e1",     // More visible border
        },
        text: {
          primary: "#0f172a",   // Near-black charcoal text
          secondary: "#475569", // Dark gray text
          muted: "#94a3b8",     // Muted gray text
        },
        accent: {
          blue: {
            DEFAULT: "#708d75", // Sage Green (replaces blue theme)
            light: "#96b399",
            dark: "#4f6352",
          },
          terracotta: {
            DEFAULT: "#c96547", // Warm Terracotta (User requested for sidebar)
            light: "#e09277",
            dark: "#a04a32",
          },
          teal: {
            DEFAULT: "#1e7b6f",
            light: "#2fa192",
            dark: "#124f47",
          },
          amber: {
            DEFAULT: "#c27a2b",
            light: "#df9d50",
            dark: "#8d5415",
          },
          green: {
            DEFAULT: "#228b61",
            light: "#34b27f",
            dark: "#135c3e",
          },
          red: {
            DEFAULT: "#b33232",
            light: "#d44b4b",
            dark: "#801d1d",
          },
          purple: {
            DEFAULT: "#5e3bb5",
            light: "#7b5cd6",
            dark: "#40228c",
          }
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
