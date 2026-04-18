const CB_EVENTS = [
  { cb: 'ECB', event: 'Rate Decision',  date: '2026-04-17', color: '#a855f7' },
  { cb: 'BoJ', event: 'Policy Meeting', date: '2026-04-30', color: '#e879f9' },
  { cb: 'Fed', event: 'FOMC Meeting',   date: '2026-05-06', color: '#22d3ee' },
  { cb: 'BoE', event: 'MPC Decision',   date: '2026-05-07', color: '#22d3ee' },
  { cb: 'ECB', event: 'Rate Decision',  date: '2026-06-05', color: '#a855f7' },
  { cb: 'Fed', event: 'FOMC Meeting',   date: '2026-06-10', color: '#22d3ee' },
  { cb: 'BoJ', event: 'Policy Meeting', date: '2026-06-16', color: '#e879f9' },
  { cb: 'BoE', event: 'MPC Decision',   date: '2026-06-18', color: '#22d3ee' },
]

function daysUntil(dateStr) {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function dayColor(days) {
  if (days <= 0)  return '#6b7280'
  if (days <= 7)  return '#e879f9'
  if (days <= 30) return '#22d3ee'
  return '#6b7280'
}

export default function CBCalendar() {
  const upcoming = CB_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)

  return (
    <div>
      <p className="text-[10px] text-nn-muted tracking-widest uppercase mb-2">Central Bank Calendar</p>
      <div className="space-y-1.5">
        {upcoming.map((e, i) => {
          const dc = dayColor(e.days)
          return (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: e.color + '22', color: e.color, border: `1px solid ${e.color}44` }}
              >
                {e.cb}
              </span>
              <span className="text-nn-muted flex-1 truncate">{e.event}</span>
              <span className="mono text-[9px] flex-shrink-0" style={{ color: dc }}>
                {e.days === 0 ? 'TODAY' : `${e.days}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
