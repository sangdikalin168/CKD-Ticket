/** @type {import('tailwindcss').Config} */

// Every colour is an HSL triplet custom property (see src/index.css) so the
// `/alpha` modifier works on all of them: `bg-swim/10`, `text-ink-soft`, ...
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/tailwind-datepicker-react/dist/**/*.js",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        // The compact ledger step. lineHeight 1.6: Khmer stacks subscripts
        // (coeng) and below-vowels, which crowd the next line at 1.4.
        caption: ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.02em' }],
        // Board type: titles and headings in marker weight (900), prices on tiles.
        title: ['1.125rem', { lineHeight: '1.4' }],
        heading: ['1.5rem', { lineHeight: '1.2' }],
        price: ['1.875rem', { lineHeight: '1.1' }],
      },
      colors: {
        // Board world
        board: token("board"),
        "board-grid": token("board-grid"),
        tray: token("tray"),
        rule: token("rule"),
        ink: token("ink"),
        "ink-soft": token("ink-soft"),
        swim: token("swim"),
        gym: token("gym"),
        steam: token("steam"),
        combo: token("combo"),
        magnet: {
          done: token("magnet-done"),
          pending: token("magnet-pending"),
          rejected: token("magnet-rejected"),
          info: token("magnet-info"),
          off: token("magnet-off"),
        },
        amber: token("amber"),
        "amber-deep": token("amber-deep"),

        // shadcn names (mapped onto the board tokens in index.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        warning: {
          DEFAULT: token("warning"),
          foreground: token("warning-foreground"),
        },
        info: {
          DEFAULT: token("info"),
          foreground: token("info-foreground"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
        },
        sidebar: {
          DEFAULT: token("sidebar-background"),
          foreground: token("sidebar-foreground"),
          primary: token("sidebar-primary"),
          "primary-foreground": token("sidebar-primary-foreground"),
          accent: token("sidebar-accent"),
          "accent-foreground": token("sidebar-accent-foreground"),
          border: token("sidebar-border"),
          ring: token("sidebar-ring"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // A magnet on the board: real offset, soft blur.
        magnet: "0 2px 4px rgb(0 0 0 / 0.25)",
        // A card lifted off the board (hovered tile, dragged request).
        lift: "0 4px 10px rgb(0 0 0 / 0.14)",
        // Floating panels: dialogs, menus.
        overlay: "0 12px 32px rgb(0 0 0 / 0.12)",
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
        // Progress-bar sheen (LoadingOverlay).
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        // A marker stroke drawing left to right across a tile.
        "board-stroke": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        // The one authored motion: a new line writing itself onto today's board.
        "board-line-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // A request card arriving in its next column.
        "board-card-in": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.4s linear infinite",
        "board-stroke": "board-stroke 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "board-line-in": "board-line-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "board-card-in": "board-card-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  variants: {
    extend: {
      visibility: ["group-hover"],
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
}
