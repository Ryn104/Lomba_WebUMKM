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
      queryParams: { prompt: 'select_account' },
    },
  })

  // Lengkapi profil dari metadata OAuth (Google) hanya bila masih kosong.
  // Avatar hasil unggahan manual (avatar_path terisi) tidak pernah ditimpa.
  const syncProfileFromMetadata = useCallback(async (user, current) => {
    if (!user || !current || current.avatar_path) return current
    const meta = user.user_metadata || {}
    const metaAvatar = meta.avatar_url || meta.picture || ''
    const metaName = meta.full_name || meta.name || ''
    const patch = {}
    if (!current.avatar_url && metaAvatar) patch.avatar_url = metaAvatar
    if (!current.full_name && metaName) patch.full_name = metaName
    if (!Object.keys(patch).length) return current

    const { data } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .maybeSingle()
    return data || { ...current, ...patch }
  }, [])

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return null
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    const profileData = await syncProfileFromMetadata(user, data)
    setProfile(profileData)
    return profileData
  }, [syncProfileFromMetadata])

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
      setTimeout(() => loadProfile(s?.user), 0)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()
  const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  const updatePassword = (password) => supabase.auth.updateUser({ password })

  const isEmailRegistered = async (email) => {
    const { data, error } = await supabase.rpc('is_email_registered', { p_email: email })
    return { registered: Boolean(data), error }
  }

  const sendSignupOtp = (email) =>
    supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })

  const verifySignupOtp = (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' })

  const completeSignup = async ({ password, full_name }) => {
    const { data, error } = await supabase.auth.updateUser({ password, data: { full_name } })
    if (error) return { error }
    const { error: pErr } = await supabase
      .from('profiles').update({ full_name }).eq('id', data.user.id)
    if (pErr) return { error: pErr }
    return { error: null }
  }

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
    isEmailRegistered,
    sendSignupOtp,
    verifySignupOtp,
    completeSignup,
    signIn,
    signOut,
    refreshProfile: () => loadProfile(session?.user),
    displayAvatarUrl:
      profile?.avatar_url ||
      session?.user?.user_metadata?.avatar_url ||
      session?.user?.user_metadata?.picture ||
      '',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}