import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import 'leaflet/dist/leaflet.css'
import './index.css'

/** Notifikasi mengikuti tema aktif */
function ThemedToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1d2a47' : '#FFFFFF',
          color: isDark ? '#F1F5F9' : '#0F172A',
          border: `1px solid ${isDark ? '#34425f' : '#E2E8F0'}`,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: isDark ? '#34D399' : '#047857',
            secondary: isDark ? '#1d2a47' : '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: isDark ? '#F87171' : '#991B1B',
            secondary: isDark ? '#1d2a47' : '#FFFFFF',
          },
        },
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)