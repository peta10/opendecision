import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ppm-tool/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Open Decision brand colors
        'midnight': '#0B1E2D',
        'mint': '#D4E8E6',
        'summit': '#5A9990',

        // Scout AI color - ONLY the exact logo color #6EDCD1
        // User explicitly requested: no brighter variants
        'scout': '#6EDCD1',

        // Mint Green scale - based on Scout AI color
        'mint-green': {
          25:  '#F0FDFA',  // almost white with hint of mint
          50:  '#CCFBF1',  // very light
          100: '#99F6E4',  // light
          200: '#6EDCD1',  // PRIMARY - Scout AI color
          300: '#5EEAD4',  // bright
          400: '#2DD4BF',  // medium
          500: '#14B8A6',  // darker
          600: '#0D9488',  // dark
          700: '#0F766E',  // very dark
          800: '#115E59',  // darker
          900: '#134E4A',  // darkest
        },

        // Legacy alpine-blue scale (kept for compatibility during migration)
        'alpine-blue': {
          25: 'rgb(243, 248, 255)',
          50: 'rgb(230, 240, 255)',
          100: 'rgb(179, 212, 255)',
          200: 'rgb(128, 184, 255)',
          300: 'rgb(77, 156, 255)',
          400: 'rgb(26, 128, 255)',
          500: 'rgb(0, 87, 183)',
          600: 'rgb(0, 74, 158)',
          700: 'rgb(0, 61, 133)',
          800: 'rgb(0, 48, 108)',
          900: 'rgb(0, 35, 83)',
        },

        // Semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
  plugins: [require("tailwindcss-animate")],
  corePlugins: {
    preflight: true,
  },
}

export default config
