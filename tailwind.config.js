// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#0f0f11",
        "dark-card": "#17171a",
        "dark-border": "#2a2a30",
        "dark-text": "#e8e8f0",
        "dark-muted": "#6b6b7d",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        blink: {
          "0%, 80%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
        msgIn: {
          "from": { opacity: "0", transform: "translateY(6px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        dropIn: {
          "from": { opacity: "0", transform: "translateY(-6px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "from": { opacity: "0", transform: "translateX(20px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite linear",
        blink: "blink 1s infinite",
        "msg-in": "msgIn 0.2s ease",
        dropIn: "dropIn 0.15s ease",
        slideIn: "slideIn 0.2s ease",
      },
    },
  },
  plugins: [],
};