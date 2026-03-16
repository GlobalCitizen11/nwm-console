import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#0c1117",
        panel: "#121922",
        edge: "#223041",
        ink: "#d7e0ea",
        muted: "#7f90a4",
        phaseYellow: "#d5b349",
        phaseOrange: "#c76c2d",
        phaseRed: "#a94646",
        phaseViolet: "#645091",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(34, 48, 65, 0.7), 0 14px 30px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
} satisfies Config;
