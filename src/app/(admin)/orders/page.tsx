'use client'

import React, { useEffect, useState } from 'react'
import { useOrderStore, Order } from '@/store/useOrderStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Clock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  Check, 
  X, 
  Volume2, 
  VolumeX,
  Plus
} from 'lucide-react'

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders, updateOrderStatus } = useOrderStore()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Track elapsed time for SLA badges
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
    setTimeout(() => setNow(Date.now()), 0)
    
    // Refresh elapsed time counters every 30 seconds
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchOrders])

  // sound alarm tester
  const testAlarm = () => {
    useOrderStore.getState().playNotificationSound()
  }

  // Calculate elapsed minutes since order creation
  const getElapsedMinutes = (createdAtString: string) => {
    if (now === null) return 0
    const created = new Date(createdAtString)
    const diffMs = Math.max(0, now - created.getTime())
    return Math.floor(diffMs / 60000)
  }

  // Generate wait color classes depending on wait duration
  const getWaitSlaStyle = (minutes: number) => {
    if (minutes >= 15) {
      return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 animate-pulse'
    }
    if (minutes >= 10) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  }

  const getSlaCardBorder = (minutes: number, status: string) => {
    if (status !== 'NEW' && status !== 'PREPARING') return 'border-border/40'
    if (minutes >= 15) return 'border-red-500/50 shadow-md shadow-red-500/5'
    if (minutes >= 10) return 'border-amber-500/50'
    return 'border-border/40'
  }

  const handleStatusChange = async (orderId: string, nextStatus: Order['status']) => {
    setUpdatingId(orderId)
    const success = await updateOrderStatus(orderId, nextStatus)
    if (success && soundEnabled && nextStatus === 'NEW') {
      // If we got a new order, play audio (usually triggered on socket listener, but kept for client actions)
    }
    setUpdatingId(null)
  }

  // Segment active orders for pipeline columns
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
  const newOrders = activeOrders.filter((o) => o.status === 'NEW')
  const preparingOrders = activeOrders.filter((o) => o.status === 'PREPARING' || o.status === 'READY')

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Orders Pipeline
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Realtime dining queue with audio alerts and waiter SLA trackers
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-300 ${
              soundEnabled
                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/15'
                : 'bg-muted text-muted-foreground border-border/40 hover:bg-muted/80'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Alert Sounds: ON' : 'Alert Sounds: MUTED'}
          </button>
          <button
            onClick={testAlarm}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border/40 bg-background/50 hover:bg-muted cursor-pointer transition-all duration-300"
          >
            Test Chime
          </button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/20">
          <div className="text-center space-y-2">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm font-semibold text-muted-foreground">Connecting to order feed...</p>
          </div>
        </div>
      ) : (
        /* Kanban Pipeline Lanes */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 align-stretch">
          
          {/* COLUMN 1: NEW ORDERS */}
          <div className="flex flex-col h-full min-h-[500px] rounded-2xl border border-border/40 bg-zinc-950/20 dark:bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                <h3 className="font-bold text-sm tracking-wide text-foreground">NEW ORDERS</h3>
              </div>
              <Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border-blue-500/10">
                {newOrders.length}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              {newOrders.length === 0 ? (
                <div className="flex h-full min-h-[200px] items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground">No incoming orders yet.</p>
                </div>
              ) : (
                newOrders.map((order) => {
                  const waitTime = getElapsedMinutes(order.createdAt)
                  return (
                    <Card 
                      key={order.id} 
                      className={`bg-card/75 backdrop-blur-md transition-all duration-300 border ${getSlaCardBorder(waitTime, order.status)}`}
                    >
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base font-bold">
                            {order.tableNumber.toLowerCase().includes('table') ? order.tableNumber : `Table ${order.tableNumber}`}
                          </CardTitle>
                          <CardDescription className="text-[10px] mt-0.5 text-muted-foreground">ID: #{order.id.slice(0, 8)}</CardDescription>
                        </div>
                        <Badge className={`rounded-xl border font-bold text-[10px] flex items-center gap-1 ${getWaitSlaStyle(waitTime)}`}>
                          <Clock className="h-3 w-3" />
                          {waitTime === 0 ? 'Just now' : `${waitTime}m waiting`}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 pb-2">
                        {/* Order Items List */}
                        <ul className="space-y-1 mt-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-xs flex flex-col border-b border-border/10 py-1 last:border-0">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {item.quantity}x {item.menuItem.name}
                                </span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                              {item.note && (
                                <span className="text-[10px] text-orange-500 font-semibold mt-0.5 ml-5">
                                  ↳ {item.note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        
                        {/* Customization notes */}
                        {order.notes && (
                          <div className="mt-3 rounded-lg bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 p-2.5 text-[11px] text-orange-600 dark:text-orange-300 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p className="leading-normal font-medium">{order.notes}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 border-t border-border/20 flex items-center justify-between gap-3 bg-zinc-950/5 dark:bg-zinc-950/20 rounded-b-2xl">
                        <div className="text-xs">
                          <p className="text-[10px] text-muted-foreground leading-none">Total Value</p>
                          <p className="text-sm font-extrabold mt-1">₹{order.total}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                            disabled={updatingId === order.id}
                            className="p-2 rounded-lg border border-border/40 bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 cursor-pointer disabled:opacity-50"
                            title="Cancel Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'PREPARING')}
                            disabled={updatingId === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs cursor-pointer shadow-sm shadow-orange-500/10 disabled:opacity-50"
                          >
                            Accept
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </CardFooter>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING IN KITCHEN */}
          <div className="flex flex-col h-full min-h-[500px] rounded-2xl border border-border/40 bg-zinc-950/20 dark:bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm tracking-wide text-foreground">KITCHEN PREPARING</h3>
              </div>
              <Badge variant="secondary" className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-amber-500/10">
                {preparingOrders.length}
              </Badge>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              {preparingOrders.length === 0 ? (
                <div className="flex h-full min-h-[200px] items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground">Kitchen is currently idle.</p>
                </div>
              ) : (
                preparingOrders.map((order) => {
                  const waitTime = getElapsedMinutes(order.createdAt)
                  return (
                    <Card 
                      key={order.id} 
                      className={`bg-card/75 backdrop-blur-md transition-all duration-300 border ${getSlaCardBorder(waitTime, order.status)}`}
                    >
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base font-bold">
                            {order.tableNumber.toLowerCase().includes('table') ? order.tableNumber : `Table ${order.tableNumber}`}
                          </CardTitle>
                          <CardDescription className="text-[10px] mt-0.5 text-muted-foreground">ID: #{order.id.slice(0, 8)}</CardDescription>
                        </div>
                        <Badge className={`rounded-xl border font-bold text-[10px] flex items-center gap-1 ${getWaitSlaStyle(waitTime)}`}>
                          <Clock className="h-3 w-3" />
                          {waitTime === 0 ? 'Just now' : `${waitTime}m active`}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 pb-2">
                        {/* Order Items List */}
                        <ul className="space-y-1 mt-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-xs flex flex-col border-b border-border/10 py-1 last:border-0">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {item.quantity}x {item.menuItem.name}
                                </span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                              {item.note && (
                                <span className="text-[10px] text-orange-500 font-semibold mt-0.5 ml-5">
                                  ↳ {item.note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>

                        {/* Customization notes */}
                        {order.notes && (
                          <div className="mt-3 rounded-lg bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 p-2.5 text-[11px] text-orange-600 dark:text-orange-300 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p className="leading-normal font-medium">{order.notes}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 border-t border-border/20 flex items-center justify-between gap-3 bg-zinc-950/5 dark:bg-zinc-950/20 rounded-b-2xl">
                        <div className="text-xs">
                          <p className="text-[10px] text-muted-foreground leading-none">Total Value</p>
                          <p className="text-sm font-extrabold mt-1">₹{order.total}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                            disabled={updatingId === order.id}
                            className="p-2 rounded-lg border border-border/40 bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 cursor-pointer disabled:opacity-50"
                            title="Cancel Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                            disabled={updatingId === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs cursor-pointer shadow-sm shadow-emerald-500/10 disabled:opacity-50"
                          >
                            Deliver
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      </CardFooter>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
