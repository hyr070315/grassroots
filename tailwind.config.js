/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#FFFFFF',
          surface: '#F5F5F7',
          border: '#E5E5EA',
          blue: '#0066CC',
          'blue-hover': '#0052A3',
          text: '#1D1D1F',
          sub: '#6E6E73',
          danger: '#C5342E',
          'danger-hover': '#A82820',
          success: '#248A3D',
          warn: '#B7791F'
        }
      },
      fontFamily: {
        apple: [
          '-apple-system',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'Helvetica Neue',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif'
        ]
      },
      boxShadow: {
        apple: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'apple-sm': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)'
      }
    }
  },
  plugins: []
}