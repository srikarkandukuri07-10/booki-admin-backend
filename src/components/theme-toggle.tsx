'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-xl border-border/40 bg-background/50 hover:bg-muted/80 backdrop-blur-sm cursor-pointer transition-all duration-300 active:scale-95"
      aria-label="Toggle theme"
      id="theme-toggler"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-indigo-400" />
    </Button>
  )
}
