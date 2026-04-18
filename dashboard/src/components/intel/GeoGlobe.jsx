import { Suspense, lazy, useRef, useState, useEffect, Component } from 'react'
import { useIntelConflicts } from '../../hooks/useIntelligence'

const GlobeGL = lazy(() => import('react-globe.gl'))

const TRADE_ARCS = [
  { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13,  label: 'NY↔LDN',  color: '#22d3ee' },
  { startLat: 51.51, startLng: -0.13,  endLat: 22.40, endLng: 114.10, label: 'LDN↔HK',  color: '#a855f7' },
  { startLat: 22.40, startLng: 114.10, endLat: 35.68, endLng: 139.70, label: 'HK↔TYO',  color: '#22d3ee' },
  { startLat: 40.71, startLng: -74.01, endLat: 1.352, endLng: 103.80, label: 'NY↔SGP',  color: '#e879f9' },
  { startLat: 1.352, startLng: 103.80, endLat: 22.40, endLng: 114.10, label: 'SGP↔HK',  color: '#a855f7' },
  { startLat: 51.51, startLng: -0.13,  endLat: 50.11, endLng: 8.682,  label: 'LDN↔FRK', color: '#22d3ee' },
  { startLat: 40.71, startLng: -74.01, endLat: 43.65, endLng: -79.40, label: 'NY↔TOR',  color: '#e879f9' },
]

function ptColor(intensity) {
  if (intensity >= 75) return '#ef4444'
  if (intensity >= 55) return '#f59e0b'
  return '#eab308'
}

class GlobeErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false } }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-nn-muted text-xs">WebGL not available</p>
        </div>
      )
    }
    return this.props.children
  }
}

function GlobeInner({ conflicts, onPointClick }) {
  const globeRef = useRef()
  const [dims, setDims] = useState({ w: 600, h: 600 })
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    const ob = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    ob.observe(containerRef.current)
    return () => ob.disconnect()
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.4
    }
  }, [])

  const highIntensity = conflicts.filter(c => c.intensity >= 65)

  return (
    <div ref={containerRef} className="w-full h-full">
      <GlobeGL
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#a855f7"
        atmosphereAltitude={0.18}

        pointsData={conflicts}
        pointLat="lat"
        pointLng="lng"
        pointColor={d => ptColor(d.intensity)}
        pointAltitude={d => d.intensity / 400}
        pointRadius={0.5}
        pointLabel={d => `<div style="background:rgba(7,7,15,0.9);border:1px solid rgba(168,85,247,0.4);border-radius:8px;padding:6px 10px;font-size:11px;color:#f8fafc"><strong>${d.label}</strong><br/>Intensity: ${d.intensity}</div>`}
        onPointClick={d => onPointClick && onPointClick(d)}

        ringsData={highIntensity}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#ef444466'}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1200}

        arcsData={TRADE_ARCS}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        arcAltitude={0.3}
      />
    </div>
  )
}

export default function GeoGlobe({ onPointClick }) {
  const { data } = useIntelConflicts()
  const conflicts = [
    ...(data?.conflicts || []),
    ...(data?.disasters || []),
  ]

  return (
    <GlobeErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-nn-purple border-t-transparent animate-spin mx-auto" />
            <p className="text-nn-muted text-xs">Loading globe…</p>
          </div>
        </div>
      }>
        <GlobeInner conflicts={conflicts} onPointClick={onPointClick} />
      </Suspense>
    </GlobeErrorBoundary>
  )
}
