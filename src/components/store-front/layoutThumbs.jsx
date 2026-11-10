export default function LayoutThumb({ type, layout, color = '#0f766e', soft = '#ecfdf5', text = '#334155', className = '' }) {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      {ThumbContent({ type, layout, color, soft, text })}
    </div>
  )
}

function ThumbContent({ type, layout, color, soft, text }) {
  switch (`${type}:${layout}`) {
    /* ---- HERO ---- */
    case 'hero:split':
      return (
        <Row cols="1fr_1fr">
          <BlockPlate>
            <Bar w="w-full" tone={text} />
            <Bar w="w-4/5" tone={text} />
            <Bar w="w-10" tone={color} />
          </BlockPlate>
          <Box bg={soft} />
        </Row>
      )
    case 'hero:full':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2" style={{ background: `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)), ${soft}` }}>
          <Bar w="w-3/4" tone="#ffffff" />
          <Bar w="w-1/2" tone="#ffffff" />
          <Bar w="w-10" tone="#ffffff" />
        </div>
      )
    case 'hero:center':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2" style={{ background: soft }}>
          <Bar w="w-3/4" tone={text} />
          <Bar w="w-1/2" tone={text} />
          <Bar w="w-10" tone={color} />
        </div>
      )
    case 'hero:asym':
      return (
        <div className="relative h-full p-2" style={{ background: soft }}>
          <div className="absolute right-2 top-2 bottom-2 left-1/3 rounded-md" style={{ background: color, opacity: 0.7 }} />
          <div className="absolute left-2 top-1/2 h-16 w-2/5 -translate-y-1/2 rounded-md bg-white p-2 shadow-sm">
            <Bar w="w-full" tone={text} />
            <Bar w="w-3/4" tone={text} />
            <Bar w="w-8" tone={color} />
          </div>
        </div>
      )

    /* ---- ABOUT ---- */
    case 'about:two':
      return (
        <Row cols="1fr_1fr">
          {soft ? <Box bg={soft} /> : null}
          <BlockPlate>
            <Bar w="w-2/3" tone={text} />
            <Bar w="w-full" tone={text} />
            <Bar w="w-4/5" tone={text} />
          </BlockPlate>
        </Row>
      )
    case 'about:bgimage':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2" style={{ background: color, opacity: 0.95 }}>
          <Bar w="w-2/3" tone="#ffffff" />
          <Bar w="w-1/2" tone="#ffffff" />
          <Bar w="w-1/3" tone="#ffffff" />
        </div>
      )
    case 'about:editorial':
      return (
        <Row cols="2fr_3fr">
          <BlockPlate>
            <Bar w="w-full" tone={text} />
            <Bar w="w-1/2" tone={color} />
          </BlockPlate>
          <BlockPlate border>
            <Bar w="w-full" tone={text} />
            <Bar w="w-5/6" tone={text} />
            <Bar w="w-full" tone={text} />
          </BlockPlate>
        </Row>
      )

    /* ---- PRODUCTS ---- */
    case 'products:grid':
      return (
        <Grid cols={3} rows={2}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-0.5 rounded-md bg-white p-1 shadow-sm">
              <span className="block h-6 rounded" style={{ background: soft }} />
              <Bar w="w-3/4" tone={text} />
              <Bar w="w-1/2" tone={color} />
            </div>
          ))}
        </Grid>
      )
    case 'products:featured':
      return (
        <Row cols="3fr_2fr">
          <div className="flex flex-col gap-1 rounded-md bg-white p-1.5 shadow-sm">
            <span className="block flex-1 rounded" style={{ background: color, opacity: 0.55 }} />
            <Bar w="w-2/3" tone={text} />
            <Bar w="w-1/3" tone={color} />
          </div>
          <Grid cols={2} rows={2}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-0.5 rounded bg-white p-1 shadow-sm">
                <span className="block h-4 rounded" style={{ background: soft }} />
                <Bar w="w-3/4" tone={text} />
              </div>
            ))}
          </Grid>
        </Row>
      )
    case 'products:horizontal':
      return (
        <div className="flex h-full items-center gap-2 overflow-hidden px-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`flex h-4/5 w-16 shrink-0 flex-col gap-1 rounded-md bg-white p-1 shadow-sm ${i === 3 ? '-mr-6' : ''}`}>
              <span className="block h-5 rounded" style={{ background: soft }} />
              <Bar w="w-3/4" tone={text} />
              <Bar w="w-1/2" tone={color} />
            </div>
          ))}
        </div>
      )
    case 'products:compact':
      return (
        <div className="flex h-full flex-col justify-center gap-1 p-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-white p-1 shadow-sm">
              <span className="block h-5 w-5 shrink-0 rounded" style={{ background: soft }} />
              <Bar w="w-2/5" tone={text} />
              <span className="ml-auto"><Bar w="w-8" tone={color} /></span>
            </div>
          ))}
        </div>
      )

    /* ---- GALLERY ---- */
    case 'gallery:uniform':
      return (
        <Grid cols={3} rows={2}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded" style={{ background: i % 2 ? soft : color, opacity: i % 2 ? 1 : 0.8 }} />
          ))}
        </Grid>
      )
    case 'gallery:masonry':
      return (
        <div className="flex h-full gap-1.5 p-2">
          {[3, 5, 4].map((n, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-1.5">
              {Array.from({ length: n }).map((_, i) => (
                <div key={i} className="rounded" style={{ background: (ci + i) % 2 ? color : soft, height: `${7 + ((ci + i) % 3) * 2}px`, opacity: (ci + i) % 2 ? 0.85 : 1 }} />
              ))}
            </div>
          ))}
        </div>
      )
    case 'gallery:collage':
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5 p-2">
          <div className="col-span-2 row-span-2 rounded" style={{ background: color, opacity: 0.85 }} />
          <div className="rounded" style={{ background: soft }} />
          <div className="rounded" style={{ background: soft }} />
        </div>
      )

    /* ---- TESTIMONIALS ---- */
    case 'testimonials:cards':
      return (
        <Row cols="1fr_1fr">
          {[0, 1].map((i) => (
            <QuoteCard key={i} color={color} text={text} />
          ))}
        </Row>
      )
    case 'testimonials:carousel':
      return (
        <div className="flex h-full items-center gap-2 overflow-hidden pl-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-4/5 w-3/5 shrink-0 rounded-md bg-white p-1.5 shadow-sm ${i === 2 ? 'opacity-60 -mr-8' : ''}`}>
              <QuoteCard color={color} text={text} full />
            </div>
          ))}
        </div>
      )
    case 'testimonials:featured':
      return (
        <div className="flex h-full flex-col items-center justify-center p-2">
          <div className="w-3/4 rounded-md bg-white p-2 text-center shadow-sm">
            <Bar w="w-4/5" tone={text} center />
            <Bar w="w-1/3" tone={color} center />
          </div>
          <div className="mt-1 flex gap-1">
            {[0, 1].map((i) => (
              <span key={i} className="h-1 w-3 rounded-full" style={{ background: color, opacity: i ? 0.4 : 1 }} />
            ))}
          </div>
        </div>
      )

    /* ---- CONTACT ---- */
    case 'contact:split':
      return (
        <Row cols="1fr_1fr">
          <BlockPlate>
            <Bar w="w-4/5" tone={text} />
            <Bar w="w-3/5" tone={text} />
          </BlockPlate>
          <Box bg={soft} />
        </Row>
      )
    case 'contact:centered':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2" style={{ background: soft }}>
          <Bar w="w-1/2" tone={text} />
          <Bar w="w-2/3" tone={text} />
          <Bar w="w-10" tone={color} />
        </div>
      )
    case 'contact:cards':
      return (
        <Grid cols={4} rows={1}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded bg-white p-1.5 shadow-sm">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <Bar w="w-3/4" tone={text} />
            </div>
          ))}
        </Grid>
      )

    /* ---- HEADER ---- */
    case 'header:split':
      return (
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="block h-2.5 w-2.5 rounded" style={{ background: color }} />
          <Bar w="w-8" tone={text} />
          <span className="ml-auto flex gap-1">
            <Bar w="w-4" tone={text} />
            <Bar w="w-4" tone={text} />
            <Bar w="w-4" tone={text} />
          </span>
        </div>
      )
    case 'header:center':
      return (
        <div className="flex flex-col items-center gap-1 px-2 py-1.5">
          <span className="block h-2.5 w-2.5 rounded" style={{ background: color }} />
          <span className="flex gap-1">
            <Bar w="w-4" tone={text} />
            <Bar w="w-4" tone={text} />
            <Bar w="w-4" tone={text} />
          </span>
        </div>
      )
    case 'header:minimal':
      return (
        <div className="flex items-center px-2 py-1.5">
          <span className="block h-2.5 w-2.5 rounded" style={{ background: color }} />
          <Bar w="w-6" tone={text} />
          <span className="ml-auto"><Bar w="w-8" tone={color} /></span>
        </div>
      )

    /* ---- FOOTER ---- */
    case 'footer:minimal':
      return (
        <div className="flex items-center justify-center gap-1 px-2 py-1.5" style={{ background: '#1e293b' }}>
          <Bar w="w-6" tone="#94a3b8" />
          <Bar w="w-10" tone="#94a3b8" />
        </div>
      )
    case 'footer:multi':
      return (
        <div className="flex items-start gap-3 px-2 py-2" style={{ background: '#1e293b' }}>
          <BlockColor w="w-1/3" tone="#94a3b8" bars={2} />
          <BlockColor w="w-1/5" tone="#94a3b8" bars={3} />
          <BlockColor w="w-1/5" tone="#94a3b8" bars={3} />
        </div>
      )
    case 'footer:branded':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2" style={{ background: color }}>
          <Bar w="w-10" tone="#ffffff" />
          <Bar w="w-16" tone="#ffffff" />
          <Bar w="w-24" tone="#ffffff" />
        </div>
      )

    default:
      return <div className="flex h-full items-center justify-center p-2"><Bar w="w-1/2" tone={text} /></div>
  }
}

/* primitivas */
function Bar({ w, tone, center }) {
  return <span className={`block h-1.5 rounded-full ${w}${center ? ' mx-auto' : ''}`} style={{ background: tone, opacity: 0.55 }} />
}
function BlockPlate({ children, border }) {
  return <div className={`flex h-full flex-col justify-center gap-1 rounded-md bg-white p-1.5 ${border ? 'border border-slate-200' : 'shadow-sm'}`}>{children}</div>
}
function BlockColor({ w, tone, bars }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: bars }).map((_, i) => <Bar key={i} w={w} tone={tone} />)}
    </div>
  )
}
function Box({ bg }) {
  return <div className="h-full rounded-md" style={{ background: bg }} />
}
function QuoteCard({ color, text, full }) {
  return (
    <div className={`flex h-full ${full ? 'flex-col' : 'flex-col'} gap-1 rounded bg-white p-1.5 shadow-sm`}>
      <span className="block h-2 w-2 rounded-full" style={{ background: color }} />
      <Bar w="w-full" tone={text} />
      <Bar w="w-5/6" tone={text} />
      <Bar w="w-1/3" tone={text} />
    </div>
  )
}
function Row({ cols, children }) {
  return <div className="grid h-full gap-1.5 p-2" style={{ gridTemplateColumns: cols }}>{children}</div>
}
function Grid({ cols, rows, children }) {
  return <div className="grid h-full gap-1.5 p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>{children}</div>
}
