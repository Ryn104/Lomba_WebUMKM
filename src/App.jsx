import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ui/ProtectedRoute'
import { isSupabaseConfigured } from './lib/supabase'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import BuilderPage from './pages/BuilderPage'
import StoreDashboard from './pages/StoreDashboard'
import POSPage from './pages/POSPage'
import StoreFront from './pages/StoreFront'

function SetupNotice() {
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Supabase belum dikonfigurasi. Salin <code className="font-mono">.env.example</code> menjadi{' '}
      <code className="font-mono">.env</code> dan isi <code>VITE_SUPABASE_URL</code> &amp;{' '}
      <code>VITE_SUPABASE_ANON_KEY</code>.
    </div>
  )
}

export default function App() {
  return (
    <>
      {!isSupabaseConfigured && <SetupNotice />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/builder"
          element={
            <ProtectedRoute>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <StoreDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          }
        />

        {/* Halaman publik toko: umkm.rtrwstudio.online/nama-toko */}
        <Route path="/:slug" element={<StoreFront />} />
      </Routes>
    </>
  )
}
