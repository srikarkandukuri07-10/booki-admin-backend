import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import { Sidebar } from '@/components/sidebar'
import { SocketProvider } from '@/components/socket-provider'
import { ChefHat, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Double guard session cryptographically on the server side
  const session = await getAdminSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar adminName={session.name} />

        {/* Mobile Header Top Navigation */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-card/65 backdrop-blur-md flex items-center justify-between px-6 md:hidden z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
              <ChefHat className="h-4 w-5" />
            </div>
            <span className="font-bold tracking-tight text-foreground text-sm">Booki Admin</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Sheet Mobile Menu Navigation using shadcn Dialog primitive */}
            <Sheet>
              <SheetTrigger className="p-2 rounded-lg border border-border/40 bg-background/50 hover:bg-muted text-foreground cursor-pointer">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 bg-card/95 backdrop-blur-xl border-r border-border/40">
                <Sidebar adminName={session.name} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content Pane */}
        <div className="md:pl-72 pt-16 md:pt-0 min-h-screen">
          <main className="container mx-auto p-4 md:p-8 max-w-7xl animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SocketProvider>
  )
}
