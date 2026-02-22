import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13181f",
        slate: "#1c2735",
        cyan: "#33d8ff",
        mint: "#8cffcf",
        sun: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 24px rgba(51,216,255,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
