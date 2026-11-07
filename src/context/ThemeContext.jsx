import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

export const THEME_STORAGE_KEY = 'umkita-theme'

// Halaman platform. Selain ini (/:slug) adalah website toko publik milik UMKM dan selalu tampil terang.
// Daftar yang sama dipakai oleh skrip anti-kedip di index.html.
const PLATFORM_PATHS = ['', 'login', 'register', 'lupa-password', 'reset-password', 'admin', 'builder', 'dashboard', 'pos']

const ThemeContext = createContext({ theme: 'light', isDark: false, setTheme: () => {} })

const readStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return ['light', 'dark', 'system'].includes(value) ? value : 'light'
  } catch {
    return 'light'
  }
}

const prefersDark = () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) || false

export function ThemeProvider({ children }) {
  const { pathname } = useLocation()
  const [theme, setThemeState] = useState(readStoredTheme)
  const [systemDark, setSystemDark] = useState(prefersDark)

  // Ikuti perubahan tema sistem operasi (dipakai saat pilihan = "Sistem")
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // Sinkronkan antar tab
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setThemeState(readStoredTheme())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  const isPlatformPage = PLATFORM_PATHS.includes(pathname.split('/')[1] || '')
  const isDark = resolved === 'dark' && isPlatformPage

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  const setTheme = useCallback((next) => {
    if (!['light', 'dark', 'system'].includes(next)) return
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* penyimpanan diblokir: preferensi hanya berlaku di sesi ini */
    }
  }, [])

  const value = useMemo(() => ({ theme, isDark, setTheme }), [theme, isDark, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)