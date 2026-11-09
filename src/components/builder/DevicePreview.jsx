import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const DEVICES = {
  desktop: { label: 'Desktop', width: 1280 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 390 },
}

// Di bawah lebar ini (HP sungguhan) preview mengikuti lebar layar apa adanya
const PHONE_BREAKPOINT = 640

const SRC_DOC =
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"></body></html>'

// Samakan class/atribut <html> (mis. tema gelap & variabel warna) dengan dokumen utama
function syncRoot(doc) {
  const src = document.documentElement
  const dst = doc.documentElement
  dst.className = src.className
  dst.setAttribute('style', src.getAttribute('style') || '')
  if (src.lang) dst.lang = src.lang
  Array.from(src.attributes).forEach(({ name, value }) => {
    if (name.startsWith('data-')) dst.setAttribute(name, value)
  })
}

// Salin semua stylesheet (Tailwind, font, dll.) ke dalam iframe
function syncHead(doc) {
  doc.head.querySelectorAll('[data-preview-sync]').forEach((n) => n.remove())
  const links = []
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    const clone = node.cloneNode(true)
    clone.setAttribute('data-preview-sync', '')
    doc.head.appendChild(clone)
    if (clone.tagName === 'LINK') links.push(clone)
  })
  return links
}

const waitLoad = (link) =>
  new Promise((resolve) => {
    link.addEventListener('load', resolve, { once: true })
    link.addEventListener('error', resolve, { once: true })
  })

export default function DevicePreview({ device = 'desktop', children }) {
  const boxRef = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [doc, setDoc] = useState(null)
  const [ready, setReady] = useState(false)
  // Deteksi HP sungguhan dari lebar layar, bukan lebar panel — supaya pilihan device
  // tidak diabaikan saat panel preview di desktop sempit.
  const [phoneScreen, setPhoneScreen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${PHONE_BREAKPOINT - 1}px)`).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${PHONE_BREAKPOINT - 1}px)`)
    const onChange = (event) => setPhoneScreen(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Ukur area yang tersedia untuk preview
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const measure = (w, h) => {
      if (w && h) setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    const r = el.getBoundingClientRect()
    measure(Math.floor(r.width), Math.floor(r.height))
    const ro = new ResizeObserver(([entry]) => {
      measure(Math.floor(entry.contentRect.width), Math.floor(entry.contentRect.height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Jaga style iframe tetap sama dengan dokumen utama (HMR saat dev, ganti tema, font dinamis)
  useEffect(() => {
    if (!doc) return undefined
    let raf = 0
    const run = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        syncHead(doc)
        syncRoot(doc)
      })
    }
    const mo = new MutationObserver(run)
    mo.observe(document.head, { childList: true, subtree: true, characterData: true })
    mo.observe(document.documentElement, { attributes: true })
    return () => {
      mo.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [doc])

  const handleLoad = (e) => {
    const d = e.currentTarget.contentDocument
    if (!d) return
    // Preview hanya tampilan: link & form tidak boleh menavigasi iframe maupun aplikasi.
    // Fase capture dipakai agar berjalan sebelum handler React (mis. <Link> react-router).
    const block = (ev) => {
      if (ev.type === 'submit' || ev.target?.closest?.('a[href]')) ev.preventDefault()
    }
    d.addEventListener('click', block, true)
    d.addEventListener('submit', block, true)
    syncRoot(d)
    const links = syncHead(d)
    setDoc(d)
    // Tampilkan iframe setelah stylesheet siap (maks. 1,5 detik) supaya tidak berkedip tanpa style
    Promise.race([
      Promise.all(links.map(waitLoad)),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).then(() => setReady(true))
  }

  const phone = phoneScreen && box.w > 0
  const spec = DEVICES[device] || DEVICES.desktop
  const virtualWidth = phone ? box.w : spec.width
  const scale = box.w ? Math.min(1, box.w / virtualWidth) : 1
  const frameWidth = Math.round(virtualWidth * scale)

  const caption = phone
    ? null
    : `${spec.label} · ${virtualWidth}px `

  return (
    <div className="flex h-full min-h-0 flex-col">
      {caption && <p className="mb-2 shrink-0 text-center text-xs font-medium text-slate-500">{caption}</p>}

      <div ref={boxRef} className="min-h-0 flex-1">
        <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-xl" style={{ width: frameWidth, height: box.h }}>
          <iframe
            title="Preview website"
            srcDoc={SRC_DOC}
            onLoad={handleLoad}
            className="block border-0 bg-white"
            style={{
              width: virtualWidth,
              height: scale ? box.h / scale : box.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              visibility: ready ? 'visible' : 'hidden',
            }}
          />
        </div>
      </div>

      {/* Konten dirender ke dalam iframe; event React (klik section) tetap bekerja lewat portal */}
      {doc && createPortal(children, doc.body)}
    </div>
  )
}