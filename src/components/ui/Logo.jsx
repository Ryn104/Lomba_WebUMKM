import { Store } from 'lucide-react'
import logo from '/logo.png'

const LOGO_IMAGE = logo 
const APP_NAME = 'UMKITA' 
const LOGO_COLOR = '#13342c'

export default function Logo({ size = 'md', withName = true, className = '' }) {
  const box = { sm: 'p-1', md: 'p-1.5', lg: 'p-3' }[size]
  const icon = { sm: 14, md: 18, lg: 28 }[size]
  const text = { sm: 'text-base text-[#13342c] font-[Baloo 2] font-sans', md: 'text-xl text-[#13342c] font-[Baloo 2] font-sans', lg: 'text-2xl text-[#13342c] font-[Baloo 2] font-sans' }[size]

  return (
    <span className={`inline-flex items-center gap-2 mt-1 font-extrabold ${className}`}>
      {LOGO_IMAGE ? (
        <img src={LOGO_IMAGE} alt={APP_NAME} className={size === 'lg' ? 'h-12 w-12 object-contain' : 'h-8 w-8 object-contain'} />
      ) : (
        <span className={`rounded-lg bg-brand-600 ${box} text-white`}>
          <Store size={icon} />
        </span>
      )}
      {withName && <span className={text}>{APP_NAME}</span>}
    </span>
  )
}