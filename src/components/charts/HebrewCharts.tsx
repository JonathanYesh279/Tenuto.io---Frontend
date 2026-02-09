import React from 'react'

// Since we don't have chart libraries installed, I'll create custom Hebrew-friendly chart components
// In a real app, you would use libraries like Chart.js, Recharts, or D3.js with Hebrew/RTL customizations

interface ChartData {
  label: string
  value: number
  color?: string
}

interface BaseChartProps {
  data: ChartData[]
  title?: string
  className?: string
  showValues?: boolean
  showPercentages?: boolean
}

// Simple Bar Chart with Hebrew labels
export const BarChart: React.FC<BaseChartProps> = ({
  data,
  title,
  className = '',
  showValues = true,
  showPercentages = false
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={`${className}`} dir="rtl">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4 font-reisinger-yonatan">
          {title}
        </h4>
      )}
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          const valuePercentage = total > 0 ? (item.value / total) * 100 : 0
          
          return (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm font-reisinger-yonatan text-right truncate ml-3">
                {item.label}
              </div>
              
              <div className="flex-1 relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color || '#3B82F6'
                    }}
                  />
                </div>
              </div>
              
              <div className="w-12 text-sm font-medium text-gray-900 text-center mr-3 font-reisinger-yonatan">
                {showValues && item.value}
                {showPercentages && `${Math.round(valuePercentage)}%`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Donut Chart with Hebrew labels
export const DonutChart: React.FC<BaseChartProps & { centerText?: string }> = ({
  data,
  title,
  className = '',
  centerText,
  showValues = true
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]

  // Calculate angles for each segment
  let currentAngle = 0
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      color: item.color || colors[index % colors.length]
    }
  })

  // SVG path calculation for donut segments
  const createPath = (segment: any, outerRadius: number, innerRadius: number) => {
    const startAngleRad = (segment.startAngle * Math.PI) / 180
    const endAngleRad = ((segment.startAngle + segment.angle) * Math.PI) / 180
    
    const x1 = 100 + outerRadius * Math.cos(startAngleRad)
    const y1 = 100 + outerRadius * Math.sin(startAngleRad)
    const x2 = 100 + outerRadius * Math.cos(endAngleRad)
    const y2 = 100 + outerRadius * Math.sin(endAngleRad)
    
    const x3 = 100 + innerRadius * Math.cos(endAngleRad)
    const y3 = 100 + innerRadius * Math.sin(endAngleRad)
    const x4 = 100 + innerRadius * Math.cos(startAngleRad)
    const y4 = 100 + innerRadius * Math.sin(startAngleRad)
    
    const largeArc = segment.angle > 180 ? 1 : 0
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }

  return (
    <div className={`${className}`} dir="rtl">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4 font-reisinger-yonatan">
          {title}
        </h4>
      )}
      
      <div className="flex items-center space-x-6 space-x-reverse">
        {/* Chart */}
        <div className="relative">
          <svg width="200" height="200" className="transform rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createPath(segment, 80, 50)}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${segment.label}: ${segment.value} (${Math.round(segment.percentage)}%)`}
              />
            ))}
          </svg>
          
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
                  {total}
                </div>
                <div className="text-xs text-gray-600 font-reisinger-yonatan">
                  {centerText}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-reisinger-yonatan">
                  {segment.label}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                {showValues && segment.value} ({Math.round(segment.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Line Chart for trends with Hebrew labels
export const LineChart: React.FC<{
  data: Array<{ label: string; value: number }>
  title?: string
  className?: string
  color?: string
  showDots?: boolean
  trend?: 'up' | 'down' | 'neutral'
}> = ({
  data,
  title,
  className = '',
  color = '#3B82F6',
  showDots = true,
  trend
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 280 + 10 // 10px padding
    const y = 100 - ((item.value - minValue) / range) * 80 + 10 // 10px padding, 80px height
    return { x, y, ...item }
  })

  // Create SVG path
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${path} ${command} ${point.x} ${point.y}`
  }, '')

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`${className}`} dir="rtl">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            {title}
          </h4>
          {trend && (
            <span className={`text-xs font-medium ${getTrendColor()} font-reisinger-yonatan`}>
              {trend === 'up' ? '↗ עלייה' : trend === 'down' ? '↘ ירידה' : '→ יציב'}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <svg width="300" height="120" className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="300" height="120" fill="url(#grid)" />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Dots */}
          {showDots && points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              className="drop-shadow-sm hover:r-6 transition-all cursor-pointer"
              title={`${point.label}: ${point.value}`}
            />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-2">
          {data.map((item, index) => (
            <span
              key={index}
              className="text-xs text-gray-600 font-reisinger-yonatan"
              style={{ width: `${100 / data.length}%`, textAlign: 'center' }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Progress Ring Chart
export const ProgressRingChart: React.FC<{
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  subtitle?: string
  className?: string
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  label,
  subtitle,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={`flex flex-col items-center ${className}`} dir="rtl">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            {Math.round(percentage)}%
          </span>
          {subtitle && (
            <span className="text-xs text-gray-600 font-reisinger-yonatan">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      
      {label && (
        <span className="mt-2 text-sm font-medium text-gray-700 text-center font-reisinger-yonatan">
          {label}
        </span>
      )}
    </div>
  )
}

// Simple Gauge Chart for performance metrics
export const GaugeChart: React.FC<{
  value: number
  max?: number
  min?: number
  title?: string
  subtitle?: string
  color?: string
  thresholds?: Array<{ value: number; color: string; label: string }>
  className?: string
}> = ({
  value,
  max = 100,
  min = 0,
  title,
  subtitle,
  color = '#3B82F6',
  thresholds = [
    { value: 30, color: '#EF4444', label: 'נמוך' },
    { value: 70, color: '#F59E0B', label: 'בינוני' },
    { value: 100, color: '#10B981', label: 'גבוה' }
  ],
  className = ''
}) => {
  const normalizedValue = Math.min(Math.max(value, min), max)
  const percentage = ((normalizedValue - min) / (max - min)) * 100
  
  // Determine color based on thresholds
  const currentThreshold = thresholds.find(t => normalizedValue <= t.value) || thresholds[thresholds.length - 1]
  const gaugeColor = currentThreshold.color

  return (
    <div className={`${className}`} dir="rtl">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4 text-center font-reisinger-yonatan">
          {title}
        </h4>
      )}
      
      <div className="relative flex items-center justify-center">
        <svg width="200" height="120" className="overflow-visible">
          {/* Background arc */}
          <path
            d="M 40 100 A 60 60 0 0 1 160 100"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d="M 40 100 A 60 60 0 0 1 160 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="188.5" // Approximate arc length
            strokeDashoffset={188.5 - (percentage / 100) * 188.5}
            className="transition-all duration-500 ease-out"
          />
          
          {/* Needle indicator */}
          <g transform="translate(100, 100)">
            <circle r="4" fill="#374151" />
            <line
              x1="0"
              y1="0"
              x2={`${50 * Math.cos(Math.PI - (percentage / 100) * Math.PI)}`}
              y2={`${50 * Math.sin(Math.PI - (percentage / 100) * Math.PI)}`}
              stroke="#374151"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
        
        {/* Center value */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
            {normalizedValue}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-600 font-reisinger-yonatan">
              {subtitle}
            </div>
          )}
          <div className="text-xs font-medium font-reisinger-yonatan" style={{ color: gaugeColor }}>
            {currentThreshold.label}
          </div>
        </div>
      </div>
      
      {/* Threshold indicators */}
      <div className="flex justify-between mt-4 px-4">
        {thresholds.map((threshold, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full mb-1"
              style={{ backgroundColor: threshold.color }}
            />
            <span className="text-xs text-gray-600 font-reisinger-yonatan">
              {threshold.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}