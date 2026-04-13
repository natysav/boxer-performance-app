import { useEffect, useRef } from 'react'
import { ALL_SKILLS } from '../lib/skills'

export default function RadarChart({ boxerRatings, coachRatings }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [boxerRatings, coachRatings])

  function drawPolygon(ctx, values, cx, cy, maxR, startAngle, angleStep, fillColor, strokeColor, glowColor) {
    if (!values.some(v => v > 0)) return
    ctx.beginPath()
    values.forEach((v, i) => {
      const a = startAngle + i * angleStep
      const r = (v / 5) * maxR
      i === 0 ? ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r) : ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r)
    })
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()

    ctx.beginPath()
    values.forEach((v, i) => {
      const a = startAngle + i * angleStep
      const r = (v / 5) * maxR
      i === 0 ? ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r) : ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r)
    })
    ctx.closePath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    values.forEach((v, i) => {
      if (v > 0) {
        const a = startAngle + i * angleStep
        const r = (v / 5) * maxR
        const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill()
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fillStyle = strokeColor; ctx.fill()
      }
    })
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.parentElement.getBoundingClientRect()
    const size = Math.min(rect.width, rect.height)
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const cx = size / 2, cy = size / 2, maxR = size * 0.36
    const n = ALL_SKILLS.length
    const angleStep = (Math.PI * 2) / n
    const startAngle = -Math.PI / 2

    ctx.clearRect(0, 0, size, size)

    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = ring === 5 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1; ctx.stroke()
    }

    for (let i = 0; i < n; i++) {
      const a = startAngle + i * angleStep
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a)*maxR, cy + Math.sin(a)*maxR)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.stroke()
    }

    const cv = ALL_SKILLS.map(s => coachRatings[s] || 0)
    const bv = ALL_SKILLS.map(s => boxerRatings[s] || 0)
    drawPolygon(ctx, cv, cx, cy, maxR, startAngle, angleStep, 'rgba(45,156,219,0.15)', '#2d9cdb', 'rgba(45,156,219,0.5)')
    drawPolygon(ctx, bv, cx, cy, maxR, startAngle, angleStep, 'rgba(230,57,70,0.18)', '#e63946', 'rgba(230,57,70,0.5)')

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const labelR = maxR + 26
    ALL_SKILLS.forEach((skill, i) => {
      const a = startAngle + i * angleStep
      const x = cx + Math.cos(a)*labelR, y = cy + Math.sin(a)*labelR
      const hasVal = (boxerRatings[skill] || 0) > 0 || (coachRatings[skill] || 0) > 0
      ctx.fillStyle = hasVal ? '#e8e8ec' : '#5a5a68'
      ctx.font = `${hasVal ? '600' : '400'} ${size < 400 ? 7 : 9.5}px Barlow, sans-serif`
      const deg = ((a * 180 / Math.PI) + 360) % 360
      ctx.textBaseline = (deg > 80 && deg < 100) ? 'top' : (deg > 260 && deg < 280) ? 'bottom' : 'middle'
      ctx.textAlign = (deg > 90 && deg < 270) ? 'right' : (deg < 90 || deg > 270) ? 'left' : 'center'
      const words = skill.split(' ')
      if (words.length > 1 && size >= 350) {
        const lh = size < 400 ? 10 : 12
        words.forEach((w, wi) => ctx.fillText(w, x, y + (wi - (words.length-1)/2)*lh))
      } else ctx.fillText(skill, x, y)
    })
  }

  return (
    <div className="chart-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}
