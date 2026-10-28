import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }
)

export const PLATFORM_DOMAIN =
  import.meta.env.VITE_PLATFORM_DOMAIN || 'umkm.rtrwstudio.online'

export const BUCKET = 'store-assets'

/** Upload gambar ke Supabase Storage dan kembalikan URL publik */
export async function uploadImage(file, folder = 'misc') {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
