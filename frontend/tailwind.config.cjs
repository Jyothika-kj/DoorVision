/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#131315",
        surface: "#131315",
        "surface-container-lowest": "#0e0e10",
        "surface-container-low": "#1b1b1d",
        "surface-container": "#1f1f21",
        "surface-container-high": "#2a2a2b",
        "surface-container-highest": "#353436",
        "surface-variant": "#353436",

        primary: "#bec6e0",
        "primary-container": "#0f172a",
        "on-primary": "#283044",

        secondary: "#7bd0ff",
        tertiary: "#4edea3",
        error: "#ffb4ab",

        "on-background": "#e4e2e4",
        "on-surface": "#e4e2e4",
        "on-surface-variant": "#c6c6cd",

        outline: "#909097",
        "outline-variant": "#45464d",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        command: "0 18px 60px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};