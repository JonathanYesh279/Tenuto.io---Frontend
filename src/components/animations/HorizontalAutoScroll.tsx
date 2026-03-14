import { useRef, useEffect, useState, type ReactNode } from 'react'

interface HorizontalAutoScrollProps {
  children: ReactNode
  /** Pixels per second */
  speed?: number
  className?: string
}

export function HorizontalAutoScroll({
  children,
  speed = 80,
  className = ''
}: HorizontalAutoScrollProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [textWidth, setTextWidth] = useState(0)
  const offsetRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const isPausedRef = useRef(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const measure = () => {
      if (outerRef.current) setContainerWidth(outerRef.current.getBoundingClientRect().width)
      if (textRef.current) setTextWidth(textRef.current.getBoundingClientRect().width)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (outerRef.current) ro.observe(outerRef.current)
    return () => ro.disconnect()
  }, [children])

  // Single text scrolls from right edge to left edge, then resets
  useEffect(() => {
    if (prefersReducedMotion || containerWidth === 0 || textWidth === 0) return

    // Total travel: start fully off-screen right → end fully off-screen left
    const totalTravel = containerWidth + textWidth

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time

      if (!isPausedRef.current) {
        const delta = (time - lastTimeRef.current) / 1000
        offsetRef.current += delta * speed

        if (offsetRef.current >= totalTravel) {
          offsetRef.current -= totalTravel
        }

        if (textRef.current) {
          // Start at right edge of container, move left
          const x = containerWidth - offsetRef.current
          textRef.current.style.transform = `translateX(${x}px)`
        }
      }

      lastTimeRef.current = time
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed, containerWidth, textWidth, prefersReducedMotion])

  const handleMouseEnter = () => { isPausedRef.current = true }
  const handleMouseLeave = () => { isPausedRef.current = false }

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ overflow: 'hidden', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={textRef}
        style={{ display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  )
}
