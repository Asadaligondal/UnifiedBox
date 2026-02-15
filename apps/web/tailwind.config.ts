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
        notion: {
          bg: "#fafafa",
          sidebar: "#f7f6f3",
          surface: "#ffffff",
          border: "rgba(55,53,47,0.09)",
          text: "#37352f",
          "text-secondary": "#6b6b6b",
          "text-tertiary": "#9b9a97",
          accent: "#2383e2",
          "accent-hover": "#0d6bcc",
          hover: "rgba(55,53,47,0.08)",
          "hover-dark": "rgba(55,53,47,0.16)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
