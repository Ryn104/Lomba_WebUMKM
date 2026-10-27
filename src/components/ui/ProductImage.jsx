const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f1f5f9"/>
  <g fill="none" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <path d="M200 100 L290 148 L290 252 L200 300 L110 252 L110 148 Z"/>
    <path d="M110 148 L200 196 L290 148"/>
    <path d="M200 196 L200 300"/>
    <path d="M155 124 L245 172"/>
  </g>
</svg>`

export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

/** Menampilkan foto produk; jika kosong / gagal dimuat, pakai gambar default */
export default function ProductImage({ src, alt = '', className = 'h-full w-full object-cover' }) {
  return (
    <img
      src={src || DEFAULT_PRODUCT_IMAGE}
      alt={alt}
      className={className}
      onError={(e) => {
        if (e.currentTarget.src !== DEFAULT_PRODUCT_IMAGE) e.currentTarget.src = DEFAULT_PRODUCT_IMAGE
      }}
    />
  )
}