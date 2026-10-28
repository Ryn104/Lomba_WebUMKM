import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const openLayers = []
let previousOverflow = null

function lockPageScroll() {
  if (openLayers.length === 0) {
    const dashboardScroller = document.querySelector('[data-dashboard-scroll]')
    previousOverflow = {
      body: document.body.style.overflow,
      root: document.documentElement.style.overflow,
      dashboard: dashboardScroller,
      dashboardOverflow: dashboardScroller?.style.overflow,
    }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (dashboardScroller) dashboardScroller.style.overflow = 'hidden'
  }
}

function unlockPageScroll() {
  if (openLayers.length !== 0 || !previousOverflow) return
  document.body.style.overflow = previousOverflow.body
  document.documentElement.style.overflow = previousOverflow.root
  if (previousOverflow.dashboard) previousOverflow.dashboard.style.overflow = previousOverflow.dashboardOverflow
  previousOverflow = null
}

export default function ModalLayer({
  open,
  onClose,
  children,
  className = 'flex items-center justify-center p-4',
  labelledBy,
  label,
  backdropLabel = 'Tutup dialog',
  backdropClosable = true,
  canClose = true,
}) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const layer = { close: closeRef }
    lockPageScroll()
    openLayers.push(layer)

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || openLayers[openLayers.length - 1] !== layer || !canClose) return
      event.preventDefault()
      closeRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const index = openLayers.indexOf(layer)
      if (index !== -1) openLayers.splice(index, 1)
      unlockPageScroll()
    }
  }, [open, canClose])

  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] isolate ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label || 'Dialog'}
    >
      <button
        type="button"
        aria-label={backdropLabel}
        tabIndex={backdropClosable && canClose ? 0 : -1}
        className="absolute inset-0 z-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={backdropClosable && canClose ? onClose : undefined}
      />
      {children}
    </div>,
    document.body
  )
}
