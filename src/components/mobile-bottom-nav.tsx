'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  UtensilsCrossed 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Analytics',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Kitchen',
      href: '/kitchen',
      icon: ChefHat,
    },
    {
      name: 'Menu',
      href: '/menu',
      icon: UtensilsCrossed,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border/40 bg-card/85 backdrop-blur-xl md:hidden z-30 flex items-center justify-around px-2 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 text-xs font-semibold select-none",
              isActive 
                ? "text-orange-500 scale-105" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 transition-transform duration-300",
              isActive ? "text-orange-500 fill-orange-500/10 stroke-[2.5]" : "text-muted-foreground"
            )} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
