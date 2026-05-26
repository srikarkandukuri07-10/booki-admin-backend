import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  gradient: string // Tailwind gradient classes
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  gradient,
}) => {
  return (
    <Card className="relative overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      {/* Dynamic top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r ${gradient}`} />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={`rounded-xl p-3 bg-gradient-to-br ${gradient} text-white shadow-md shadow-primary/10`}>
            {icon}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
