import { useRef, useEffect, useState, type ReactNode } from 'react'

interface VerticalAutoScrollProps {
  children: ReactNode
  /** Pixels per second */
  speed?: number
  /** Container height in pixels (default: auto-sizes to parent) */
  height?: number
  className?: string
}

export function VerticalAutoScroll({
  children,
  speed = 20,
  height,
  className = ''
}: VerticalAutoScrollProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const offsetRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const isPausedRef = useRef(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Measure content height
  useEffect(() => {
    if (!innerRef.current) return
    const measure = () => {
      const h = innerRef.current?.children[0]
      if (h) setContentHeight(h.getBoundingClientRect().height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (innerRef.current.children[0]) {
      ro.observe(innerRef.current.children[0])
    }
    return () => ro.disconnect()
  }, [children])

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || contentHeight === 0) return

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time

      if (!isPausedRef.current) {
        const delta = (time - lastTimeRef.current) / 1000
        offsetRef.current += delta * speed

        if (offsetRef.current >= contentHeight) {
          offsetRef.current -= contentHeight
        }

        if (innerRef.current) {
          innerRef.current.style.transform = `translateY(-${offsetRef.current}px)`
        }
      }

      lastTimeRef.current = time
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed, contentHeight, prefersReducedMotion])

  const handleMouseEnter = () => { isPausedRef.current = true }
  const handleMouseLeave = () => { isPausedRef.current = false }

  // If reduced motion, just render children normally (no duplication, no scroll)
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const containerStyle: React.CSSProperties = {
    overflow: 'hidden',
    ...(height ? { height } : {})
  }

  return (
    <div
      ref={outerRef}
      className={className}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={innerRef} style={{ willChange: 'transform' }}>
        {/* Original content */}
        <div>{children}</div>
        {/* Duplicate for seamless loop */}
        <div aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}
