'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  UtensilsCrossed, 
  LogOut,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

interface SidebarProps {
  adminName?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ adminName = 'Admin' }) => {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      name: 'Analytics',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Feedback',
    },
    {
      name: 'Orders Dashboard',
      href: '/orders',
      icon: ShoppingBag,
      description: 'Live Realtime Queue',
    },
    {
      name: 'Kitchen View',
      href: '/kitchen',
      icon: ChefHat,
      description: 'Kitchen Rush Queue',
    },
    {
      name: 'Menu Management',
      href: '/menu',
      icon: UtensilsCrossed,
      description: 'Manage Dishes & Pricing',
    },
  ]

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-border/40 bg-card/45 backdrop-blur-xl md:block z-30">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-1">
                Booki Admin <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
              </h1>
              <p className="text-xs text-muted-foreground">Smart Dining Control</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 cursor-pointer",
                    isActive 
                      ? "bg-gradient-to-r from-orange-500/10 to-amber-500/5 text-orange-600 dark:text-orange-400 border border-orange-500/10 shadow-sm shadow-orange-500/5" 
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300 group-hover:scale-105",
                    isActive ? "text-orange-500" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] font-normal text-muted-foreground group-hover:text-muted-foreground/80 leading-none mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Area with Profile, Mode & Logout */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground">Logged in as</span>
              <span className="text-sm font-bold truncate max-w-[140px] text-foreground">{adminName}</span>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 active:scale-98 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
