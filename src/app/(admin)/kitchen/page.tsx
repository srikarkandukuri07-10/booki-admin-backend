'use client'

import React, { useEffect, useState } from 'react'
import { useOrderStore, Order } from '@/store/useOrderStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  Check, 
  Volume2, 
  VolumeX, 
  ChefHat,
  Monitor
} from 'lucide-react'

export default function KitchenPage() {
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore()
  const [kitchenSound, setKitchenSound] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
    setTimeout(() => setNow(Date.now()), 0)
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 15000) // Refresh every 15s for exact kitchen timers
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Get elapsed minutes since order creation
  const getElapsedMinutes = (createdAtString: string) => {
    if (now === null) return 0
    const created = new Date(createdAtString)
    const diffMs = Math.max(0, now - created.getTime())
    return Math.floor(diffMs / 60000)
  }

  const handleStartCooking = async (orderId: string) => {
    setUpdatingId(orderId)
    await updateOrderStatus(orderId, 'PREPARING')
    setUpdatingId(null)
  }

  const handleFinishCooking = async (orderId: string) => {
    setUpdatingId(orderId)
    await updateOrderStatus(orderId, 'DELIVERED')
    setUpdatingId(null)
  }

  // Filter only active cooking queue orders: NEW and PREPARING
  const kitchenOrders = orders
    .filter((o) => o.status === 'NEW' || o.status === 'PREPARING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // FIFO (First In First Out) for kitchen cooking queue!

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              KITCHEN QUEUE
            </h1>
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase mt-0.5">
              Live Cooking Feed • First-In First-Out (FIFO) Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setKitchenSound(!kitchenSound)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-300 ${
              kitchenSound
                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                : 'bg-muted text-muted-foreground border-border/40'
            }`}
          >
            {kitchenSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {kitchenSound ? 'KITCHEN BUZZER: ON' : 'KITCHEN BUZZER: MUTED'}
          </button>
          
          <Badge className="bg-orange-500 text-white font-black text-sm px-3.5 py-1.5 rounded-xl">
            {kitchenOrders.length} TICKETS ACTIVE
          </Badge>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center rounded-2xl border border-border/40 bg-card/25 backdrop-blur-md">
          <div className="text-center space-y-3">
            <ChefHat className="h-10 w-10 animate-bounce text-orange-500 mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">Initializing kitchen feed...</p>
          </div>
        </div>
      ) : kitchenOrders.length === 0 ? (
        /* Empty State */
        <div className="flex h-[400px] flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/40 bg-zinc-950/5 p-8">
          <ChefHat className="h-16 w-16 text-muted-foreground/45 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">All Tables Cleared!</h3>
          <p className="text-xs text-muted-foreground/80 max-w-xs mt-1">
            Excellent job! No pending cooking tickets in the queue.
          </p>
        </div>
      ) : (
        /* Kitchen Grid Layout with MASSIVE tick cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kitchenOrders.map((order, index) => {
            const minutes = getElapsedMinutes(order.createdAt)
            const isNew = order.status === 'NEW'
            
            // Wait SLA Alert styles
            const getKitchenCardClass = () => {
              if (isNew) {
                return 'border-blue-500/40 bg-blue-500/[0.02] shadow-blue-500/5'
              }
              if (minutes >= 15) {
                return 'border-red-500 bg-red-500/[0.03] shadow-red-500/5 animate-pulse'
              }
              if (minutes >= 10) {
                return 'border-amber-500/50 bg-amber-500/[0.02] shadow-amber-500/5'
              }
              return 'border-border/60 bg-card'
            }

            return (
              <Card 
                key={order.id} 
                className={`relative overflow-hidden border-2 rounded-3xl transition-all duration-300 ${getKitchenCardClass()}`}
              >
                {/* FIFO Sequence Number Banner */}
                <div className={`absolute top-0 left-0 right-0 h-2 ${
                  isNew ? 'bg-blue-500' : minutes >= 15 ? 'bg-red-500' : 'bg-amber-500'
                }`} />

                <CardContent className="p-6 space-y-5">
                  {/* Card Header (Table #, Timer, Sequence) */}
                  <div className="flex items-center justify-between border-b border-border/30 pb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-muted-foreground uppercase">TICKET #{index + 1}</span>
                      <h2 className="text-3xl font-black tracking-tight text-foreground">TABLE {order.tableNumber}</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-xl font-black text-xs flex items-center gap-1.5 px-3 py-1 ${
                        minutes >= 15 
                          ? 'bg-red-500 text-white' 
                          : minutes >= 10 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {minutes === 0 ? 'Just now' : `${minutes}m ago`}
                      </Badge>
                    </div>
                  </div>

                  {/* Cooking Items (MASSIVE, ULTRA READABLE TEXT) */}
                  <div className="space-y-3 min-h-[140px]">
                    <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">DISHES TO COOK</h4>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li 
                          key={item.id} 
                          className="flex flex-col border-b border-dashed border-border/20 pb-2"
                        >
                          <div className="flex items-start justify-between text-lg font-bold text-foreground w-full">
                            <span className="flex items-baseline gap-2.5">
                              <span className="text-2xl font-black text-orange-500">{item.quantity}x</span>
                              <span className="text-xl font-extrabold tracking-tight">{item.menuItem.name}</span>
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                              {item.menuItem.category?.name || 'Food'}
                            </span>
                          </div>
                          {item.note && (
                            <span className="text-sm font-black text-amber-500 dark:text-amber-400 tracking-wide mt-1.5 ml-9 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg w-fit">
                              ↳ {item.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Special Customization Notes (HIGHLIGHTED AND ENLARGED) */}
                  {order.notes ? (
                    <div className="rounded-2xl bg-destructive/10 border-2 border-destructive/25 p-3.5 flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-black tracking-widest text-red-500 uppercase">PREPARATION NOTES</h5>
                        <p className="text-base font-black text-red-600 dark:text-red-300 tracking-tight leading-snug mt-1 uppercase">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[50px] flex items-center justify-center rounded-2xl border border-dashed border-border/20">
                      <span className="text-xs text-muted-foreground/60 font-semibold tracking-wider">STANDARD PREPARATION</span>
                    </div>
                  )}

                  {/* Kitchen Action Trigger */}
                  <div className="pt-2 border-t border-border/30">
                    {isNew ? (
                      <button
                        onClick={() => handleStartCooking(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base cursor-pointer tracking-wider shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 uppercase flex items-center justify-center gap-2"
                      >
                        <ChefHat className="h-5 w-5" />
                        START COOKING
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFinishCooking(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base cursor-pointer tracking-wider shadow-lg shadow-orange-500/15 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 uppercase flex items-center justify-center gap-2"
                      >
                        <Check className="h-5 w-5 stroke-[3px]" />
                        FINISH PREPARATION
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
