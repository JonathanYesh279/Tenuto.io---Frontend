import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface DragCarouselProps {
  children: React.ReactNode
  className?: string
}

export function DragCarousel({ children, className = '' }: DragCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })
  const isDragging = useRef(false)

  useEffect(() => {
    const update = () => {
      if (!containerRef.current || !wrapperRef.current) return
      const contentWidth = containerRef.current.scrollWidth
      const viewportWidth = wrapperRef.current.clientWidth
      const overflow = contentWidth - viewportWidth

      if (overflow <= 0) {
        setConstraints({ left: 0, right: 0 })
        return
      }

      // RTL: content starts at right edge, overflows to the left
      // User drags right (positive x) to reveal left-side content
      setConstraints({ left: 0, right: overflow })
    }

    update()
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [children])

  // Block click events on children when user was dragging
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, [])

  return (
    <div ref={wrapperRef} className={`overflow-hidden ${className}`} onClickCapture={handleClickCapture}>
      <motion.div
        ref={containerRef}
        className="flex gap-4 px-1 items-stretch cursor-grab active:cursor-grabbing select-none"
        drag="x"
        dragConstraints={constraints}
        dragElastic={0.15}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        onDragStart={() => { isDragging.current = true }}
        onDragEnd={() => { requestAnimationFrame(() => { isDragging.current = false }) }}
        style={{ minWidth: 'max-content' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
