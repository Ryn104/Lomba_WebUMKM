import logo from '/logo3.png'

const LOGO_IMAGE = logo
const APP_NAME = 'UMKITA' 
 
export default function Logo({ size = 'md', className = '' }) {
  const h = { sm: 'h-8', md: 'h-10', lg: 'h-16', xl: 'h-24' }[size]
  return <img src={LOGO_IMAGE} alt={APP_NAME} className={`${h} w-auto object-contain ${className}`} />
}
 