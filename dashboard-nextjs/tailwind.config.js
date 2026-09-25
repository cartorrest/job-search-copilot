/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        ink: '#1B2A41',
        blueprint: {
          50: '#EAF2F6',
          100: '#CFE2EA',
          300: '#8FB9CC',
          500: '#2E6F95',
          700: '#1F4E6B',
          900: '#12324A',
        },
        status: {
          saved: '#94A3B8',
          hired: '#15803D',
          applied: '#6B7280',
          screening: '#38BDF8',
          interview: '#22C55E',
          offer: '#8B5CF6',
          rejected: '#DC2626',
          withdrawn: '#F97316',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        blueprintgrid:
          'linear-gradient(rgba(46,111,149,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(46,111,149,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
    },
  },
  plugins: [],
};
