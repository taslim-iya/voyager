import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["EB Garamond", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "sans-serif"],
      },
      colors: {
        bg: { DEFAULT: "#fafaf9", 2: "#f5f5f3", 3: "#eeede9" },
        surface: { DEFAULT: "#ffffff", hover: "#f9f9f7" },
        border: { DEFAULT: "#dddcd8", subtle: "#eeeee9" },
        text: { DEFAULT: "#1a1a1a", 2: "#555555", 3: "#888888" },
        accent: { DEFAULT: "#1a1a1a", hover: "#000000", light: "rgba(0,0,0,0.04)" },
        gold: { DEFAULT: "#B8860B", light: "rgba(184,134,11,0.08)" },
        success: { DEFAULT: "#16a34a", light: "rgba(22,163,74,0.08)" },
        danger: { DEFAULT: "#dc2626", light: "rgba(220,38,38,0.06)" },
        info: { DEFAULT: "#2563eb", light: "rgba(37,99,235,0.06)" },
      },
    },
  },
  plugins: [],
};
export default config;
