import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  /** Delay before animation starts (seconds) */
  delay?: number
  /** How much of the element must be visible to trigger (0-1) */
  amount?: number
  /** Only animate once, or re-animate on every scroll in/out */
  once?: boolean
  className?: string
}

export function ScrollReveal({
  children,
  delay = 0,
  amount = 0.3,
  once = true,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount, once })

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={inView ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.92, opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
