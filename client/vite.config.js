import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Only proxy API sub-paths, NOT the bare route (which is a React page)
      '/auth': 'http://localhost:5001',
      '/donations': 'http://localhost:5001',
      '/leaderboard': 'http://localhost:5001',
      '/notifications': 'http://localhost:5001',
      '/ratings': 'http://localhost:5001',
      '/health': 'http://localhost:5001',
      // Admin API: match /admin/* (sub-paths only, not /admin itself)
      '/admin/all': 'http://localhost:5001',
      '/admin/stats': 'http://localhost:5001',
      '/admin/volunteers': 'http://localhost:5001',
      '/admin/volunteer': 'http://localhost:5001',
      '/admin/donation': 'http://localhost:5001',
      '/admin/export': 'http://localhost:5001',
      '/applications': 'http://localhost:5001',
    },
  },
})
