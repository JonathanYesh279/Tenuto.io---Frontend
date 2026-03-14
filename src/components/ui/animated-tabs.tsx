import * as React from "react"
import { motion, type Transition } from "framer-motion"

import { cn } from "@/lib/utils"

type TabsContextType = {
  activeValue: string
  handleValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

function useTabs(): TabsContextType {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("useTabs must be used within Tabs")
  return context
}

/* ─── Tabs Root ─── */

interface TabsProps extends React.ComponentProps<"div"> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const isControlled = value !== undefined
  const activeValue = isControlled ? value : internal

  const handleValueChange = (val: string) => {
    if (!isControlled) setInternal(val)
    onValueChange?.(val)
  }

  return (
    <TabsContext.Provider value={{ activeValue, handleValueChange }}>
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/* ─── TabsList ─── */

function TabsList({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── TabsTrigger ─── */

interface TabsTriggerProps extends React.ComponentProps<"button"> {
  value: string
}

function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
  const { activeValue, handleValueChange } = useTabs()
  const isActive = activeValue === value

  return (
    <button
      role="tab"
      data-state={isActive ? "active" : "inactive"}
      onClick={() => handleValueChange(value)}
      className={cn(
        "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ─── TabsContents (horizontal strip that slides) ─── */

interface TabsContentsProps extends React.ComponentProps<"div"> {
  transition?: Transition
}

function TabsContents({
  children,
  className,
  transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs()
  const childrenArray = React.Children.toArray(children)

  const activeIndex = childrenArray.findIndex(
    (child) =>
      React.isValidElement(child) &&
      child.props &&
      "value" in child.props &&
      child.props.value === activeValue
  )

  return (
    <div
      className={cn("overflow-hidden px-1 -mx-1", className)}
      {...props}
    >
      <motion.div
        className="flex"
        style={{ direction: "ltr" }}
        animate={{ x: `${activeIndex * -100}%` }}
        transition={transition}
      >
        {childrenArray.map((child, index) => (
          <div key={index} className="w-full shrink-0 px-1" style={{ direction: "rtl" }}>
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── TabsContent (individual panel) ─── */

interface TabsContentProps extends React.ComponentProps<"div"> {
  value: string
}

function TabsContent({ children, value, className, ...props }: TabsContentProps) {
  const { activeValue } = useTabs()
  const isActive = activeValue === value

  return (
    <div
      role="tabpanel"
      inert={!isActive ? true : undefined}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent }
