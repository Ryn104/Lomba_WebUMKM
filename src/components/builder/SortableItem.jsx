import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { SECTION_TYPES } from '../store-front/sectionDefs'

export default function SortableItem({ section, selected, onSelect, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const def = SECTION_TYPES[section.type]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white p-2.5 text-sm shadow-sm transition ${
        selected ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
      } ${isDragging ? 'opacity-70 shadow-lg' : ''} ${section.is_visible ? '' : 'opacity-50'}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
        aria-label="Geser"
      >
        <GripVertical size={16} />
      </button>
      <def.icon size={16} className="text-brand-700" />
      <span className="flex-1 font-medium text-slate-900">{def.label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title={section.is_visible ? 'Sembunyikan' : 'Tampilkan'}
      >
        {section.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
