'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useMenuStore, MenuItem, MenuCategory } from '@/store/useMenuStore'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Check, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'

export default function MenuManagementPage() {
  const { categories, isLoading, error, fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } = useMenuStore()
  
  const [activeTab, setActiveTab] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Form State
  const [itemId, setItemId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [veg, setVeg] = useState(true)
  const [availability, setAvailability] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState('')
  
  // Upload helper states
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submittingForm, setSubmittingForm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  // Extract flat items from categories for flat filtering
  const allItems: (MenuItem & { categoryName: string })[] = []
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      allItems.push({ ...item, categoryName: cat.name })
    })
  })



  // Handle opening dialog for ADDING a menu item
  const handleOpenAdd = () => {
    setIsEditMode(false)
    setItemId(null)
    setName('')
    setDescription('')
    setPrice('')
    setVeg(true)
    setAvailability(true)
    setCategoryId(categories[0]?.id || '')
    setImage('')
    setFormError(null)
    setUploadError(null)
    setIsDialogOpen(true)
  }

  // Handle opening dialog for EDITING a menu item
  const handleOpenEdit = (item: MenuItem) => {
    setIsEditMode(true)
    setItemId(item.id)
    setName(item.name)
    setDescription(item.description || '')
    setPrice(item.price.toString())
    setVeg(item.veg)
    setAvailability(item.availability)
    setCategoryId(item.categoryId)
    setImage(item.image || '')
    setFormError(null)
    setUploadError(null)
    setIsDialogOpen(true)
  }

  // Handle Image File selection and instant API upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setImage(data.url)
      } else {
        setUploadError(data.error || 'Failed to upload image file.')
      }
    } catch (err) {
      setUploadError('Network error uploading image.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Form Submission (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmittingForm(true)

    if (!name || !price || !categoryId) {
      setFormError('Name, price, and category are required.')
      setSubmittingForm(false)
      return
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Price must be a valid positive number.')
      setSubmittingForm(false)
      return
    }

    const payload = {
      name,
      description,
      image: image || null,
      price: parsedPrice,
      veg,
      availability,
      categoryId,
    }

    let success = false
    if (isEditMode && itemId) {
      success = await updateMenuItem(itemId, payload)
    } else {
      success = await createMenuItem(payload)
    }

    if (success) {
      setIsDialogOpen(false)
    } else {
      setFormError('Failed to save menu item. Check administrative privileges.')
    }
    setSubmittingForm(false)
  }

  // Handle delete item
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      const res = await deleteMenuItem(id)
      if (!res.success) {
        alert(res.error || 'Failed to delete menu item.')
      }
    }
  }

  // Filter items based on activeTab
  const filteredItems = activeTab === 'all' 
    ? allItems 
    : allItems.filter((i) => i.categoryId === activeTab)

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Digital Menu Catalog
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Update descriptions, pricing, photos, and instantly toggle dish availability
          </p>
        </div>

        {/* Add item trigger */}
        <Button 
          onClick={handleOpenAdd}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-orange-500/10"
        >
          <Plus className="h-5 w-5" />
          Add Menu Item
        </Button>
      </div>

      {isLoading && allItems.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center rounded-2xl border border-border/40 bg-card/20">
          <div className="text-center space-y-2">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm font-semibold text-muted-foreground">Hydrating digital menu...</p>
          </div>
        </div>
      ) : (
        /* Tabs Container */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-6 border-b border-border/40 pb-3 justify-start rounded-none">
            <TabsTrigger 
              value="all" 
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border/20'
              }`}
            >
              All Items ({allItems.length})
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id}
                value={cat.id}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border/20'
                }`}
              >
                {cat.name} ({cat.items.length})
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Catalog grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.length === 0 ? (
              <div className="col-span-full flex h-[250px] flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/40 bg-card/10">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground/45 mb-2" />
                <h4 className="font-bold text-muted-foreground">Category is Empty</h4>
                <p className="text-xs text-muted-foreground/75 mt-1">Add items to this category using the button above.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className={`bg-card/65 backdrop-blur-md transition-all duration-300 border border-border/40 flex flex-col justify-between ${
                    !item.availability ? 'opacity-65 grayscale-[30%] border-dashed' : ''
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      {/* Image preview or standard fallback */}
                      <div className="h-16 w-16 rounded-xl border border-border/50 bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base truncate leading-none text-foreground">{item.name}</h3>
                          <Badge className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                            item.veg 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10'
                          }`}>
                            {item.veg ? 'VEG' : 'NON-VEG'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 h-8 leading-snug">{item.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 pb-2">
                    <div className="flex items-center justify-between py-2 border-t border-b border-border/20 mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Pricing</span>
                      <span className="text-lg font-extrabold text-foreground">₹{item.price}</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-muted-foreground">Ordering Status</span>
                        <span className={`text-[10px] font-bold ${item.availability ? 'text-emerald-500' : 'text-red-400'}`}>
                          {item.availability ? 'Available to Order' : 'Sold Out / Blocked'}
                        </span>
                      </div>
                      
                      {/* Availability switcher */}
                      <Switch 
                        checked={item.availability} 
                        onCheckedChange={() => toggleAvailability(item.id, item.availability)}
                        className="cursor-pointer"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-2 border-t border-border/20 flex items-center justify-between gap-3 bg-zinc-950/5 dark:bg-zinc-950/20 rounded-b-2xl">
                    <span className="text-[10px] font-semibold text-muted-foreground/80 tracking-wide uppercase">
                      {item.categoryName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 rounded-lg cursor-pointer hover:bg-destructive/10 border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </Tabs>
      )}

      {/* CREATE & EDIT dialog form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card/95 border border-border/40 backdrop-blur-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              {isEditMode ? (
                <>
                  <Edit3 className="h-5 w-5 text-orange-500" />
                  Edit Menu Item
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-orange-500" />
                  Add New Dish
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete the digital details below to broadcast this dish to your ordering app.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-red-400 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold leading-none">{formError}</span>
              </div>
            )}

            {/* Dish Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Item Name</label>
              <Input
                type="text"
                placeholder="e.g. Tandoori Butter Chicken"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 rounded-xl bg-background/50 border-border/40 text-sm text-foreground focus:bg-background"
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-xl bg-background/50 border border-border/40 text-foreground cursor-pointer outline-none focus:bg-background transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Price (INR)</label>
                <Input
                  type="number"
                  placeholder="349.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="h-10 rounded-xl bg-background/50 border-border/40 text-sm text-foreground focus:bg-background"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Dish Description</label>
              <textarea
                placeholder="Explain marinades, flavors, garnish details, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 text-sm rounded-xl bg-background/50 border border-border/40 text-foreground outline-none focus:bg-background transition-colors resize-none placeholder-zinc-500"
              />
            </div>

            {/* Image upload widget */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Dish Photo</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl border border-border/50 bg-zinc-900/60 overflow-hidden flex items-center justify-center shrink-0">
                  {image ? (
                    <img src={image} alt="Upload Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-zinc-500" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="h-9 text-xs rounded-xl cursor-pointer hover:bg-muted border-border/40 flex items-center gap-1.5"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3.5 w-3.5" />
                        Choose Photo
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">Supported format: JPG, PNG, WEBP. Max size 2MB</p>
                </div>
              </div>
              {uploadError && (
                <p className="text-[10px] font-semibold text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {uploadError}
                </p>
              )}
            </div>

            {/* Option Toggles */}
            <div className="flex items-center justify-between p-3.5 border border-border/20 rounded-xl bg-zinc-950/5 dark:bg-zinc-950/20">
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-300">Vegetarian?</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Veg mark badge</span>
                </div>
                <Switch checked={veg} onCheckedChange={setVeg} className="cursor-pointer" />
              </div>

              <div className="w-[1px] h-8 bg-border/20" />

              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-300">Available?</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Toggle live status</span>
                </div>
                <Switch checked={availability} onCheckedChange={setAvailability} className="cursor-pointer" />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/20 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submittingForm}
                className="h-10 text-xs rounded-xl border border-border/40 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingForm}
                className="h-10 text-xs rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                {submittingForm ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Publish Dish
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
