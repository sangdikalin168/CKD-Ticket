/** @type {import('tailwindcss').Config} */

// Neutrals are HSL triplets, the accent and the four marks are RGB triplets —
// the same split CKD-POS uses, so both codebases hold the same numbers. Either
// form takes the `/alpha` modifier: `bg-wash/60`, `bg-amber/10`.
const hsl = (name) => `hsl(var(--${name}) / <alpha-value>)`;
const rgb = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  // Class-gated, and no element ever carries the class: the app is light-only.
  // Left in place deliberately — dropping it makes Tailwind fall back to
  // `media`, which would let the surviving `dark:` utilities fire on a laptop
  // whose OS is set to dark.
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
      },
      colors: {
        // Surfaces and ink
        paper: hsl("paper"),
        chalk: hsl("chalk"),
        wash: hsl("wash"),
        rule: hsl("rule"),
        floor: "var(--floor)",
        ink: {
          DEFAULT: hsl("ink"),
          deep: hsl("ink-deep"),
          soft: hsl("ink-soft"),
        },
        // `text-ink-soft` and `text-ink-deep` read better at the call site than
        // the nested form, so both spellings resolve.
        "ink-soft": hsl("ink-soft"),
        "ink-deep": hsl("ink-deep"),

        // Facilities — a quiet dot beside a name, nothing more.
        swim: hsl("swim"),
        gym: hsl("gym"),
        steam: hsl("steam"),
        combo: hsl("combo"),

        // The one accent: the committing action and a selected option.
        amber: {
          DEFAULT: rgb("amber"),
          deep: rgb("amber-deep"),
          tint: rgb("amber-tint"),
        },
        "amber-deep": rgb("amber-deep"),
        "amber-tint": rgb("amber-tint"),

        // The four marks: record state. `tint` grounds a chip, `deep` is the
        // text on that tint, the bare value is an icon or a hairline.
        paid: {
          DEFAULT: rgb("paid"),
          tint: rgb("paid-tint"),
          deep: rgb("paid-deep"),
        },
        pending: {
          DEFAULT: rgb("pending"),
          tint: rgb("pending-tint"),
          deep: rgb("pending-deep"),
        },
        void: {
          DEFAULT: rgb("void"),
          tint: rgb("void-tint"),
          deep: rgb("void-deep"),
        },
        notice: {
          DEFAULT: rgb("notice"),
          tint: rgb("notice-tint"),
          deep: rgb("notice-deep"),
        },

        // shadcn names (mapped onto the palette in index.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: hsl("primary"),
          foreground: hsl("primary-foreground"),
        },
        secondary: {
          DEFAULT: hsl("secondary"),
          foreground: hsl("secondary-foreground"),
        },
        destructive: {
          DEFAULT: hsl("destructive"),
          foreground: hsl("destructive-foreground"),
        },
        sidebar: {
          DEFAULT: hsl("sidebar-background"),
          foreground: hsl("sidebar-foreground"),
          primary: hsl("sidebar-primary"),
          "primary-foreground": hsl("sidebar-primary-foreground"),
          accent: hsl("sidebar-accent"),
          "accent-foreground": hsl("sidebar-accent-foreground"),
          border: hsl("sidebar-border"),
          ring: hsl("sidebar-ring"),
        },
        muted: {
          DEFAULT: hsl("muted"),
          foreground: hsl("muted-foreground"),
        },
        accent: {
          DEFAULT: hsl("accent"),
          foreground: hsl("accent-foreground"),
        },
        popover: {
          DEFAULT: hsl("popover"),
          foreground: hsl("popover-foreground"),
        },
        card: {
          DEFAULT: hsl("card"),
          foreground: hsl("card-foreground"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Flat at rest. Shadow means one thing: this is floating above the page.
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
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
