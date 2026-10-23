import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H
    let animId
    const particles = []
    const PARTICLE_COUNT = 180
    const LINE_DISTANCE = 100

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * W
        this.y = Math.random() * H
        this.r = Math.random() * 1.5 + 0.3
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.alpha = Math.random() * 0.5 + 0.1
        this.cyan = Math.random() > 0.3
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset()
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = this.cyan
          ? `rgba(48,102,190,${this.alpha})`
          : `rgba(9,12,155,${this.alpha})`
        ctx.fill()
      }
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < LINE_DISTANCE) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(48,102,190,${0.15 * (1 - d / LINE_DISTANCE)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    function animLoop() {
      ctx.clearRect(0, 0, W, H)

      // Subtle radial glows
      const g1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.4)
      g1.addColorStop(0, 'rgba(48,102,190,0.06)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, W, H)

      const g2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.35)
      g2.addColorStop(0, 'rgba(9,12,155,0.06)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, W, H)

      particles.forEach(p => {
        p.update()
        p.draw()
      })
      drawLines()
      animId = requestAnimationFrame(animLoop)
    }

    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle())
    }

    animLoop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-canvas" />
}
