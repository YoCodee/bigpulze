import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        /* Kanvas hangat 60% — lihat globals.css */
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        "surface-muted": "hsl(var(--surface-muted))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Tokens Aksi Primer (Enterprise Blue ala Cloudflare #0051C7)
        enterprise: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#1E60F9",
          600: "#0051C7",
          700: "#0041A3",
          800: "#00368C",
          900: "#1E3A8A",
          DEFAULT: "#0051C7",
        },
        // Tokens Identitas Merek Alur (Brand Orange #F6821F)
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F6821F",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          DEFAULT: "#F6821F",
        },
        // Sage emerald lembut untuk fitur cerdas/analitik (bukan status sukses)
        sage: {
          50: "#F1F6F1",
          100: "#E3EDE4",
          200: "#C9DCCB",
          300: "#A8C4AD",
          400: "#83A88D",
          500: "#668D72",
          600: "#4E7A60",
          700: "#3F624D",
          800: "#344F3F",
          900: "#2A4033",
          DEFAULT: "#4E7A60",
        },
        // Tokens Tema Gelap (Untuk Landing Page & Hero)
        dark: {
          canvas: "#0A0A0C",
          surface: "#121316",
          "surface-hover": "#1A1C20",
          border: "#26282D",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        crisp: "0 1px 2px 0 rgba(28, 25, 23, 0.04)",
        card: "0 1px 2px 0 rgba(28, 25, 23, 0.04), 0 1px 3px -1px rgba(28, 25, 23, 0.03)",
        soft: "0 1px 2px rgba(28, 25, 23, 0.04), 0 8px 24px -12px rgba(28, 25, 23, 0.12)",
        "glow-orange": "0 0 35px -5px rgba(246, 130, 31, 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
