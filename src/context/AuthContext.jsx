import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const signInWithGoogle = (redirectPath = '/dashboard') =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      queryParams: { prompt: 'select_account' }, // selalu tampilkan pilihan akun
    },
  })

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return null
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let mounted = true
    let currentUserId = null
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      currentUserId = data.session?.user?.id || null
      setSession(data.session)
      await loadProfile(data.session?.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const nextUserId = s?.user?.id || null
      setSession(s)
      if (currentUserId !== nextUserId) setUnsavedChanges(false)
      currentUserId = nextUserId
      // hindari deadlock: jalankan query di luar callback
      setTimeout(() => loadProfile(s?.user), 0)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = (email, password, full_name) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name } } })

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()
  const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  const updatePassword = (password) => supabase.auth.updateUser({ password })

  const verifySignupOtp = (email, token) =>
  supabase.auth.verifyOtp({ email, token, type: 'signup' })

  const resendSignupOtp = (email) =>
  supabase.auth.resend({ type: 'signup', email })

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    unsavedChanges,
    setUnsavedChanges,
    isAdmin: profile?.role === 'admin',
    loading,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    verifySignupOtp,
    resendSignupOtp,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => loadProfile(session?.user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
