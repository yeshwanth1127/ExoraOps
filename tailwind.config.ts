import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        press: ["var(--font-press-start-2p)", "monospace"],
      },
      colors: {
        brand: {
          purple: "#a855f7",
          "purple-light": "#c084fc",
          "purple-dark": "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};
export default config;
