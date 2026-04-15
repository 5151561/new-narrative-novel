import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: 'var(--app-bg)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        line: {
          soft: 'var(--line-soft)',
          strong: 'var(--line-strong)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          soft: 'var(--text-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          strong: 'var(--accent-strong)',
          muted: 'var(--accent-muted)',
        },
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        ringwarm: '0 0 0 1px var(--ring-soft)',
        pane: '0 0 0 1px var(--line-soft), 0 12px 28px rgba(20, 20, 19, 0.05)',
        insetwarm: 'inset 0 0 0 1px rgba(77, 76, 72, 0.08)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
      },
    },
  },
  plugins: [forms],
} satisfies Config
