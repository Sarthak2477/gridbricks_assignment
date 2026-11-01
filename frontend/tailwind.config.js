/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        donezo: {
          green: '#175c3b',       // Primary vibrant deep forest green
          hover: '#12492f',       // Darker green on hover
          mint: '#52b788',        // Accent mint/seafoam
          lightMint: '#eaf5ed',   // Light mint background
          canvas: '#f0f4f1',      // Soft sage-tinted neutral background
          card: '#ffffff',        // Pure white card
          border: '#e2e8f0',      // Clean card border
          dark: '#111827',        // High contrast primary dark text
          subtext: '#374151',     // High contrast readable body text
          muted: '#6b7280',       // Readable muted text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
