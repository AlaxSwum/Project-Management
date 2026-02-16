/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        dark: {
          bg: '#0D0D0D',
          'bg-secondary': '#141414',
          surface: '#1A1A1A',
          'surface-light': '#242424',
          'surface-elevated': '#2A2A2A',
          'surface-hover': '#2D2D2D',
          border: '#2D2D2D',
          'border-light': '#3D3D3D',
        },
        // Primary accent colors
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        secondary: 'var(--secondary)',
        'secondary-light': 'var(--secondary-light)',
        accent: 'var(--accent)',
        error: 'var(--error)',
        success: 'var(--success)',
        // Tag colors
        tag: {
          design: '#EC4899',
          frontend: '#3B82F6',
          backend: '#8B5CF6',
          ux: '#F59E0B',
          research: '#06B6D4',
          qa: '#10B981',
          api: '#F97316',
          database: '#6366F1',
          media: '#A855F7',
          performance: '#14B8A6',
          auth: '#EF4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 