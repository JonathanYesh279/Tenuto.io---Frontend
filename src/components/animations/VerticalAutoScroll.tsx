import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'

interface VerticalAutoScrollProps {
  children: ReactNode
  /** Pixels per second */
  speed?: number
  /** Container height in pixels (default: auto-sizes to parent) */
  height?: number
  /** Minimum number of items before auto-scroll activates (default: 4) */
  minItems?: number
  /** Actual item count — pass this so the component knows when to scroll */
  itemCount?: number
  className?: string
}

export function VerticalAutoScroll({
  children,
  speed = 20,
  height,
  minItems = 4,
  itemCount = 0,
  className = ''
}: VerticalAutoScrollProps) {
  const shouldAnimate = itemCount >= minItems

  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const offsetRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const isPausedRef = useRef(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Drag state
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartOffsetRef = useRef(0)

  // Momentum state
  const velocityRef = useRef(0)
  const lastPointerYRef = useRef(0)
  const lastPointerTimeRef = useRef(0)
  const momentumRafRef = useRef<number>(0)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>()

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

  // Normalize offset to stay within [0, contentHeight)
  const normalizeOffset = useCallback(() => {
    if (contentHeight > 0) {
      offsetRef.current = ((offsetRef.current % contentHeight) + contentHeight) % contentHeight
    }
  }, [contentHeight])

  const applyTransform = useCallback(() => {
    if (innerRef.current) {
      innerRef.current.style.transform = `translateY(-${offsetRef.current}px)`
    }
  }, [])

  // Animation loop — auto-scroll
  useEffect(() => {
    if (prefersReducedMotion || contentHeight === 0 || !shouldAnimate) return

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time

      if (!isPausedRef.current) {
        const delta = (time - lastTimeRef.current) / 1000
        offsetRef.current += delta * speed

        if (offsetRef.current >= contentHeight) {
          offsetRef.current -= contentHeight
        }

        applyTransform()
      }

      lastTimeRef.current = time
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed, contentHeight, prefersReducedMotion, applyTransform, shouldAnimate])

  // Momentum decay loop — runs after drag release
  const startMomentum = useCallback(() => {
    const friction = 0.95
    const minVelocity = 0.5

    const tick = () => {
      velocityRef.current *= friction
      offsetRef.current += velocityRef.current
      normalizeOffset()
      applyTransform()

      if (Math.abs(velocityRef.current) > minVelocity) {
        momentumRafRef.current = requestAnimationFrame(tick)
      } else {
        velocityRef.current = 0
        lastTimeRef.current = 0
        isPausedRef.current = false
      }
    }

    momentumRafRef.current = requestAnimationFrame(tick)
  }, [normalizeOffset, applyTransform])

  const stopMomentum = useCallback(() => {
    cancelAnimationFrame(momentumRafRef.current)
    velocityRef.current = 0
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
  }, [])

  // Cleanup momentum on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(momentumRafRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    stopMomentum()
    isPausedRef.current = true
  }
  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      isPausedRef.current = false
      lastTimeRef.current = 0
    }
  }

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    stopMomentum()
    isDraggingRef.current = true
    isPausedRef.current = true
    dragStartYRef.current = e.clientY
    dragStartOffsetRef.current = offsetRef.current
    lastPointerYRef.current = e.clientY
    lastPointerTimeRef.current = performance.now()
    velocityRef.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return

    const now = performance.now()
    const dt = now - lastPointerTimeRef.current
    const dy = lastPointerYRef.current - e.clientY

    if (dt > 0) {
      const instantVelocity = dy / (dt / 16)
      velocityRef.current = velocityRef.current * 0.3 + instantVelocity * 0.7
    }

    lastPointerYRef.current = e.clientY
    lastPointerTimeRef.current = now

    const deltaY = dragStartYRef.current - e.clientY
    offsetRef.current = dragStartOffsetRef.current + deltaY
    normalizeOffset()
    applyTransform()
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    if (Math.abs(velocityRef.current) > 1) {
      startMomentum()
    } else {
      lastTimeRef.current = 0
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false
      }, 800)
    }
  }

  // Mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    stopMomentum()
    isPausedRef.current = true
    offsetRef.current += e.deltaY * 0.8
    normalizeOffset()
    applyTransform()

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      lastTimeRef.current = 0
      isPausedRef.current = false
    }, 1500)
  }, [stopMomentum, normalizeOffset, applyTransform])

  // Not enough items or reduced motion — render static
  if (prefersReducedMotion || !shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  const containerStyle: React.CSSProperties = {
    overflow: 'hidden',
    cursor: 'grab',
    ...(height ? { height } : {}),
    touchAction: 'none',
    userSelect: 'none'
  }

  return (
    <div
      ref={outerRef}
      className={`active:cursor-grabbing ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div ref={innerRef} className="flex flex-col gap-4" style={{ willChange: 'transform' }}>
        {/* Original content */}
        <div>{children}</div>
        {/* Duplicate for seamless loop */}
        <div aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}
