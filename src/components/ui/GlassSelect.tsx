import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CaretDownIcon, CaretUpIcon, CheckIcon } from '@phosphor-icons/react'

interface GlassSelectOption {
  value: string
  label: string
}

interface GlassSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: GlassSelectOption[]
  placeholder?: string
  className?: string
}

export function GlassSelect({
  value,
  onValueChange,
  options,
  placeholder = 'בחר...',
  className,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      onOpenChange={setIsOpen}
    >
      {/* Trigger — wrapped in motion.div for bounce on tap */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="inline-flex"
      >
        <SelectPrimitive.Trigger
          className={cn(
            // Layout
            'relative inline-flex h-9 items-center justify-between gap-2 rounded-md px-4 py-2 text-sm font-medium',
            // Glass surface
            'backdrop-blur-2xl border border-white/70 dark:border-white/20',
            'text-slate-700 dark:text-slate-200',
            // Focus
            'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            // Hover
            'hover:border-white/90',
            // Cursor
            'cursor-pointer',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>span]:line-clamp-1',
            // Overflow hidden for reflection layers
            'overflow-hidden',
            className
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(186,230,253,0.25) 50%, rgba(255,255,255,0.5) 100%)',
            boxShadow: `
              0 4px 16px rgba(0,140,210,0.1),
              0 2px 6px rgba(0,140,210,0.06),
              inset 0 1px 2px rgba(255,255,255,0.95),
              inset 0 -1px 3px rgba(0,140,210,0.06),
              0 0 0 0.5px rgba(255,255,255,0.5)
            `,
          }}
        >
          {/* Top glossy reflection band */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-md"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 60%, transparent 100%)',
            }}
          />
          {/* Edge highlight — thin top line */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-md"
            style={{
              background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)',
            }}
          />
          {/* Corner light bloom */}
          <span
            className="pointer-events-none absolute -top-[40%] -right-[20%] w-[60%] h-[100%] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(186,230,253,0.15) 50%, transparent 70%)',
            }}
          />

          <span className="relative z-10">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon asChild>
            <motion.span
              className="relative z-10"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CaretDownIcon className="h-3.5 w-3.5 opacity-50" />
            </motion.span>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      </motion.div>

      {/* Dropdown content — using Radix animations, motion on items only */}
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          className={cn(
            'relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-2xl',
            'border border-white/70 dark:border-white/20',
            'backdrop-blur-2xl',
            // Radix open/close animations
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            'duration-200',
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,247,255,0.85) 50%, rgba(255,255,255,0.8) 100%)',
            boxShadow: `
              0 20px 60px rgba(0,140,210,0.15),
              0 8px 24px rgba(0,140,210,0.08),
              0 2px 8px rgba(0,140,210,0.05),
              inset 0 1px 2px rgba(255,255,255,0.95),
              inset 0 -1px 3px rgba(0,140,210,0.05),
              0 0 0 0.5px rgba(255,255,255,0.5)
            `,
          }}
        >
          {/* Top reflection on dropdown */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-[30%] rounded-t-full z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />
          {/* Top edge highlight */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-full z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.95) 50%, transparent 95%)',
            }}
          />

          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1.5 relative z-20">
            <CaretUpIcon className="h-3.5 w-3.5 opacity-40" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1.5 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] relative z-20">
            {options.map((option, index) => (
              <GlassSelectItem
                key={option.value}
                value={option.value}
                label={option.label}
                index={index}
              />
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1.5 relative z-20">
            <CaretDownIcon className="h-3.5 w-3.5 opacity-40" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function GlassSelectItem({ value, label, index }: { value: string; label: string; index: number }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 ps-8 pe-3 text-sm',
        'outline-none transition-all duration-150',
        'text-slate-600 dark:text-slate-300',
        'focus:bg-primary/8 focus:text-primary',
        'data-[state=checked]:text-primary data-[state=checked]:font-semibold',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'hover:bg-primary/5',
      )}
      style={{
        animationName: 'glassItemSlide',
        animationDuration: '0.25s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: `${index * 30}ms`,
      }}
    >
      <span className="absolute start-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-3.5 w-3.5 text-primary" weight="bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
