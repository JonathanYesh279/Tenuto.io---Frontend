import { type CSSProperties } from 'react'
import { motion } from 'framer-motion'

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  style?: CSSProperties
  reverse?: boolean
  borderWidth?: number
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  style,
  reverse = false,
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className || ''}`}
      style={{ zIndex: 1, ...style } as CSSProperties}
    >
      {/* Mask layer — clips to border area only */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: borderWidth,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        } as CSSProperties}
      >
        {/* Rotating conic gradient */}
        <motion.div
          style={{
            position: 'absolute',
            inset: `-${size}%`,
            background: `conic-gradient(from 0deg, transparent 0%, ${colorFrom} 8%, ${colorTo} 16%, transparent 24%)`,
          }}
          animate={{
            rotate: reverse ? -360 : 360,
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  )
}
