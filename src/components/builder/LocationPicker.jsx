import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import toast from 'react-hot-toast'
import { Search, MapPin, Crosshair } from 'lucide-react'
import Modal from '../ui/Modal'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, iconShadow: markerShadow })

const DEFAULT_CENTER = [-6.9175, 107.6191]

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) })
  return null
}

function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo(pos, 16)
  }, [pos]) 
  return null
}

export default function LocationPicker({ open, onClose, initial, onSave }) {
  const [pos, setPos] = useState(initial || null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (open) setPos(initial || null)
  }, [open, initial])

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      )
      const results = await res.json()
      if (!results.length) return toast.error('Lokasi tidak ditemukan, coba kata kunci lain')
      setPos([Number(results[0].lat), Number(results[0].lon)])
    } catch {
      toast.error('Gagal mencari lokasi, periksa koneksi internet')
    } finally {
      setSearching(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Perangkat tidak mendukung deteksi lokasi')
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => toast.error('Gagal mengambil lokasi perangkat')
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pilih Lokasi Toko"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" disabled={!pos} onClick={() => onSave(pos)}>Gunakan Titik Ini</button>
        </>
      }
    >
      <div className="space-y-3">
        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Cari alamat atau nama tempat…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-secondary" disabled={searching}>{searching ? 'Mencari…' : 'Cari'}</button>
          <button type="button" className="btn-secondary" title="Pakai lokasi perangkat saya" onClick={useMyLocation}>
            <Crosshair size={16} />
          </button>
        </form>

        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={14} /> Klik di peta untuk menandai titik lokasi toko.
        </p>

        <div className="h-80 overflow-hidden rounded-lg border border-slate-200">
          <MapContainer center={pos || DEFAULT_CENTER} zoom={pos ? 16 : 12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlace onPick={setPos} />
            <FlyTo pos={pos} />
            {pos && <Marker position={pos} />}
          </MapContainer>
        </div>

        {pos && (
          <p className="text-center font-mono text-xs text-slate-400">
            {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          </p>
        )}
      </div>
    </Modal>
  )
}