import React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

interface Step {
  id: string
  label: string
  status: 'pending' | 'current' | 'completed' | 'error'
}

interface AnimatedStepperProps {
  steps: Step[]
  className?: string
}

export const AnimatedStepper: React.FC<AnimatedStepperProps> = ({ steps, className = '' }) => {
  return (
    <div className={`flex w-full items-center px-2 ${className}`} dir="rtl">
      {steps.map((step, index) => {
        const isNotLast = index < steps.length - 1
        return (
          <React.Fragment key={step.id}>
            <StepIndicator step={index + 1} label={step.label} status={step.status} />
            {isNotLast && <StepConnector isComplete={step.status === 'completed'} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StepIndicator({ step, label, status }: { step: number; label: string; status: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          pending: {
            scale: 1,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgb(209 213 219)',
          },
          current: {
            scale: 1,
            backgroundColor: 'rgba(99, 71, 255, 0.08)',
            borderColor: 'rgb(99, 71, 255)',
          },
          completed: {
            scale: 1,
            backgroundColor: 'rgb(99, 71, 255)',
            borderColor: 'rgb(99, 71, 255)',
          },
        }}
        transition={{ duration: 0.3 }}
        className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px]"
      >
        <AnimatePresence mode="wait">
          {status === 'completed' ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckIcon className="h-3.5 w-3.5 text-white" />
            </motion.div>
          ) : status === 'current' ? (
            <motion.div
              key="pulse"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'rgb(99, 71, 255)' }}
            />
          ) : (
            <motion.span
              key="number"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-medium text-gray-400"
            >
              {step}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.span
        variants={{
          pending: { color: 'rgb(156 163 175)' },
          current: { color: 'rgb(99, 71, 255)' },
          completed: { color: 'rgb(99, 71, 255)' },
        }}
        transition={{ duration: 0.3 }}
        className="text-[11px] font-semibold whitespace-nowrap"
      >
        {label}
      </motion.span>
    </motion.div>
  )
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const lineVariants: Variants = {
    incomplete: { width: '0%' },
    complete: { width: '100%' },
  }

  return (
    <div className="relative mx-2 h-[1.5px] flex-1 overflow-hidden rounded-full bg-gray-200">
      <motion.div
        className="absolute right-0 top-0 h-full rounded-full"
        style={{ backgroundColor: 'rgb(99, 71, 255)' }}
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      />
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

export default AnimatedStepper
