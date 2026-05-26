'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChefHat, Lock, User, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/components/theme-provider'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!username || !password) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Authenticated! Redirect
        router.refresh()
        router.push(callbackUrl)
      } else {
        setError(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Failed to connect to the server. Please check your network.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Decorative Premium Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-amber-500/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-4 z-10 animate-fade-in">
        <Card className="border-border/30 bg-[#121214]/60 backdrop-blur-xl shadow-2xl shadow-black/80">
          <CardHeader className="space-y-3 flex flex-col items-center text-center">
            {/* Animated Logo */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 transform transition-transform hover:scale-105 duration-300">
              <ChefHat className="h-7 w-7" />
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
                Booki Restaurant <Sparkles className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-0.5">
                Control panel login for staff and managers
              </CardDescription>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-1">
              {/* Error Callout */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-red-400 animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <p className="font-medium leading-none">{error}</p>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-border/40 bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900/80 rounded-xl text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-border/40 bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900/80 rounded-xl text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold cursor-pointer shadow-lg shadow-orange-500/10 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
