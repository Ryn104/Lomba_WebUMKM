import {
  FaInstagram, FaFacebookF, FaXTwitter, FaThreads, FaTiktok, FaYoutube,
  FaLinkedinIn, FaTelegram, FaPinterestP, FaGlobe,
} from 'react-icons/fa6'

export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, base: 'https://instagram.com/' },
  { id: 'facebook', label: 'Facebook', icon: FaFacebookF, base: 'https://facebook.com/' },
  { id: 'x', label: 'X (Twitter)', icon: FaXTwitter, base: 'https://x.com/' },
  { id: 'threads', label: 'Threads', icon: FaThreads, base: 'https://www.threads.net/@' },
  { id: 'tiktok', label: 'TikTok', icon: FaTiktok, base: 'https://www.tiktok.com/@' },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, base: 'https://youtube.com/@' },
  { id: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, base: 'https://linkedin.com/in/' },
  { id: 'telegram', label: 'Telegram', icon: FaTelegram, base: 'https://t.me/' },
  { id: 'pinterest', label: 'Pinterest', icon: FaPinterestP, base: 'https://pinterest.com/' },
  { id: 'website', label: 'Website lain', icon: FaGlobe, base: '' },
]

export const SOCIAL_BY_ID = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p]))

export const socialUrl = (platform, value) => {
  const v = (value || '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return `https://${v}`
  if (!platform.base) return `https://${v}`
  return platform.base + v.replace(/^@/, '')
}