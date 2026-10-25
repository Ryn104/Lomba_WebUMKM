import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/** Ambil toko milik user yang sedang login (1 user = 1 toko) */
export function useMyStore() {
  const { user } = useAuth()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) {
      setStore(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    setStore(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  return { store, setStore, loading, reload }
}
