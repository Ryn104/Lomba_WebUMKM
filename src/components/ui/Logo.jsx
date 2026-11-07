import logo from '/logo3.png'
import logoDark from '/logo-dark.png'
import { useTheme } from '../../context/ThemeContext'

const APP_NAME = 'UMKITA'

export default function Logo({ size = 'md', className = '', forceDark = false, forceLight = false }) {
  const { isDark } = useTheme()
  const h = { sm: 'h-8', md: 'h-10', lg: 'h-16', xl: 'h-24' }[size]
  const useDarkLogo = forceDark || (isDark && !forceLight)

  return (
    <img
      src={useDarkLogo ? logoDark : logo}
      alt={APP_NAME}
      className={`${h} w-auto object-contain ${className}`}
    />
  )
}