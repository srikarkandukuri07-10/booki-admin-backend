'use client'

import React, { useEffect, useState } from 'react'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  IndianRupee, 
  ShoppingBag, 
  Star, 
  Utensils, 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp,
  Heart,
  Loader2,
  Sparkles
} from 'lucide-react'
import { useOrderStore } from '@/store/useOrderStore'

interface FeedbackData {
  totalCount: number
  ratingCounts: {
    MUST_TRY: number
    VERY_TASTY: number
    GOOD: number
    OK: number
  }
  percentages: {
    MUST_TRY: number
    VERY_TASTY: number
    GOOD: number
    OK: number
  }
  recentFeedback: Array<{
    id: string
    value: 'MUST_TRY' | 'VERY_TASTY' | 'GOOD' | 'OK'
    comment: string | null
    createdAt: string
    menuItem: {
      name: string
      category: { name: string }
    } | null
  }>
  popularItems: Array<{
    id: string
    name: string
    categoryName: string
    price: number
    veg: boolean
    image: string | null
    positiveCount: number
  }>
}

export default function DashboardPage() {
  const { orders, fetchOrders } = useOrderStore()
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(true)

  useEffect(() => {
    fetchOrders()
    
    // Fetch aggregated feedback statistics from our API
    const fetchFeedbackStats = async () => {
      try {
        const res = await fetch('/api/feedback')
        const data = await res.json()
        if (data.success) {
          setFeedbackData(data.data)
        }
      } catch (err) {
        console.error('Failed to load feedback analytics:', err)
      } finally {
        setLoadingFeedback(false)
      }
    }

    fetchFeedbackStats()
  }, [fetchOrders])

  // Calculate live financial statistics from orders
  const revenueTotal = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, order) => sum + order.total, 0)

  const activeOrdersCount = orders
    .filter((o) => o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'READY')
    .length

  // Weighted Customer Satisfaction Score (Must Try=100%, Very Tasty=80%, Good=60%, OK=40%)
  const calculateSatisfactionIndex = () => {
    if (!feedbackData || feedbackData.totalCount === 0) return '0%'
    const counts = feedbackData.ratingCounts
    const total = feedbackData.totalCount
    
    const weightedSum = (counts.MUST_TRY * 100) + (counts.VERY_TASTY * 80) + (counts.GOOD * 60) + (counts.OK * 40)
    const index = Math.round(weightedSum / total)
    return `${index}%`
  }

  // Get name representation for feedback enum values
  const getRatingLabel = (value: string) => {
    switch (value) {
      case 'MUST_TRY': return 'Must Try'
      case 'VERY_TASTY': return 'Very Tasty'
      case 'GOOD': return 'Good'
      case 'OK': return 'OK'
      default: return value
    }
  }

  // Get color badges for ratings
  const getRatingBadgeStyle = (value: string) => {
    switch (value) {
      case 'MUST_TRY': 
        return 'bg-red-500/10 text-red-500 border border-red-500/10 font-extrabold shadow-sm shadow-red-500/5'
      case 'VERY_TASTY': 
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10 font-bold'
      case 'GOOD': 
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10 font-semibold'
      case 'OK': 
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/10 font-medium'
      default: 
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
          Management Cockpit <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of sales revenue, active order pipeline, and live customer dining feedback
        </p>
      </div>

      {/* Primary Analytics Counter Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue (Today)"
          value={`₹${revenueTotal.toLocaleString('en-IN')}`}
          description="Excludes cancelled table orders"
          icon={<IndianRupee className="h-5 w-5" />}
          gradient="from-orange-500 to-amber-500"
        />
        <StatsCard
          title="Active Order Pipeline"
          value={activeOrdersCount}
          description="Tables waiting or preparing in kitchen"
          icon={<ShoppingBag className="h-5 w-5" />}
          gradient="from-blue-500 to-indigo-500"
        />
        <StatsCard
          title="Satisfaction Index"
          value={calculateSatisfactionIndex()}
          description={loadingFeedback ? 'Loading index...' : `Based on ${feedbackData?.totalCount || 0} reviews`}
          icon={<Star className="h-5 w-5 fill-amber-300 stroke-amber-400" />}
          gradient="from-pink-500 to-rose-500"
        />
        <StatsCard
          title="Bestseller Catalog"
          value={loadingFeedback ? '0' : feedbackData?.popularItems.length || '0'}
          description="Dishes with high positive votes"
          icon={<Utensils className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CUSTOMER FEEDBACK BREAKDOWN GRAPH */}
        <Card className="lg:col-span-2 bg-card/65 backdrop-blur-md border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Customer Rating Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Live satisfaction index percentage calculated from QR table feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-1 space-y-5">
            {loadingFeedback ? (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : !feedbackData || feedbackData.totalCount === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-center">
                <p className="text-xs text-muted-foreground">No customer ratings registered yet.</p>
              </div>
            ) : (
              /* Glowing custom percentage bars */
              <div className="space-y-4">
                {/* Bar 1: Must Try */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-red-500 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      Must Try
                    </span>
                    <span className="text-muted-foreground">{feedbackData.ratingCounts.MUST_TRY} votes ({feedbackData.percentages.MUST_TRY}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-900/60 overflow-hidden relative border border-border/10">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 shadow-md shadow-red-500/25 transition-all duration-500"
                      style={{ width: `${feedbackData.percentages.MUST_TRY}%` }}
                    />
                  </div>
                </div>

                {/* Bar 2: Very Tasty */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-orange-500 flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                      Very Tasty
                    </span>
                    <span className="text-muted-foreground">{feedbackData.ratingCounts.VERY_TASTY} votes ({feedbackData.percentages.VERY_TASTY}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-900/60 overflow-hidden relative border border-border/10">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-md shadow-orange-500/25 transition-all duration-500"
                      style={{ width: `${feedbackData.percentages.VERY_TASTY}%` }}
                    />
                  </div>
                </div>

                {/* Bar 3: Good */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-500 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      Good
                    </span>
                    <span className="text-muted-foreground">{feedbackData.ratingCounts.GOOD} votes ({feedbackData.percentages.GOOD}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-900/60 overflow-hidden relative border border-border/10">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-md shadow-amber-500/25 transition-all duration-500"
                      style={{ width: `${feedbackData.percentages.GOOD}%` }}
                    />
                  </div>
                </div>

                {/* Bar 4: OK */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                      OK
                    </span>
                    <span className="text-muted-foreground">{feedbackData.ratingCounts.OK} votes ({feedbackData.percentages.OK}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-900/60 overflow-hidden relative border border-border/10">
                    <div 
                      className="h-full rounded-full bg-zinc-500 transition-all duration-500"
                      style={{ width: `${feedbackData.percentages.OK}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BESTSELLERS RANKING */}
        <Card className="bg-card/65 backdrop-blur-md border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <Utensils className="h-5 w-5 text-orange-500" />
              Popular Dishes
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked dynamically by total positive votes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-1">
            {loadingFeedback ? (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : !feedbackData || feedbackData.popularItems.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-center">
                <p className="text-xs text-muted-foreground">No popular dishes registered yet.</p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {feedbackData.popularItems.map((item, index) => (
                  <li 
                    key={item.id}
                    className="flex items-center justify-between border-b border-border/10 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      {/* Sequence Ranking Badge */}
                      <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-black ${
                        index === 0 
                          ? 'bg-amber-500 text-white shadow shadow-amber-500/25' 
                          : index === 1 
                          ? 'bg-zinc-300 dark:bg-zinc-700 text-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-none">{item.name}</h4>
                        <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">{item.categoryName}</span>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 font-bold text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-lg">
                      <Heart className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                      {item.positiveCount} votes
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DETAILED REVIEWS FEED */}
      <Card className="bg-card/65 backdrop-blur-md border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-1.5">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Recent Customer Reviews Feed
          </CardTitle>
          <CardDescription className="text-xs">
            Scrollable log of table remarks and critiques linked to dishes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-1">
          {loadingFeedback ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : !feedbackData || feedbackData.recentFeedback.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">No customer comment logs available.</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
              {feedbackData.recentFeedback.map((fb) => (
                <div 
                  key={fb.id}
                  className="p-4 rounded-2xl bg-zinc-950/5 dark:bg-zinc-950/20 border border-border/20 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:bg-zinc-950/10 hover:dark:bg-zinc-950/30"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getRatingBadgeStyle(fb.value)}>
                        {getRatingLabel(fb.value)}
                      </Badge>
                      {fb.menuItem && (
                        <span className="text-xs text-foreground font-bold">
                          linked to: <span className="text-orange-500 font-extrabold">{fb.menuItem.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-normal font-medium italic">
                      "{fb.comment || 'No text comment submitted.'}"
                    </p>
                  </div>

                  <span className="text-[10px] text-muted-foreground whitespace-nowrap self-end sm:self-start">
                    {new Date(fb.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
