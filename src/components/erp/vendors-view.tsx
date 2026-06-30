"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Vendor, type PurchaseOrder } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Store, Search, Plus, Star, Phone, Mail, MapPin,
  ChevronRight, Pencil, Trash2, ShoppingCart, DollarSign,
  UserCheck, TrendingUp, Building2, AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const VENDOR_CATEGORIES = ["All", "Office Supplies", "Electronics", "Printing", "Software"]

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${starSize} ${star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const config: Record<string, string> = {
    "Office Supplies": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Electronics": "bg-teal-50 text-teal-700 border-teal-200",
    "Printing": "bg-amber-50 text-amber-700 border-amber-200",
    "Software": "bg-purple-50 text-purple-700 border-purple-200",
  }
  const cls = config[category] || "bg-slate-50 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#38383a]"
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{category}</Badge>
}

export function VendorsView() {
  const { vendors, purchaseOrders } = useERPStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Computed KPIs
  const totalVendors = vendors.length
  const activeVendors = vendors.filter(v => v.isActive).length
  const totalPOValue = vendors.reduce((sum, v) => {
    const vendorPOs = purchaseOrders.filter(po => po.vendorId === v.id)
    return sum + vendorPOs.reduce((s, po) => s + po.total, 0)
  }, 0)
  const avgRating = vendors.length > 0
    ? vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length
    : 0

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    let result = vendors
    if (categoryFilter !== "All") {
      result = result.filter(v => v.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
      )
    }
    return result
  }, [vendors, categoryFilter, search])

  // Vendor POs
  const vendorPOs = useMemo(() => {
    if (!selectedVendor) return []
    return purchaseOrders
      .filter(po => po.vendorId === selectedVendor.id)
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
  }, [selectedVendor, purchaseOrders])

  const vendorTotalSpend = vendorPOs.reduce((sum, po) => sum + po.total, 0)

  const handleAddVendor = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      category: formData.get("category") as string || null,
    }
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const vRes = await fetch("/api/vendors")
        const vData = await vRes.json()
        const vArr = vData.data || (Array.isArray(vData) ? vData : [])
        useERPStore.getState().setVendors(vArr)
        setShowAddVendor(false)
      }
    } catch {
      // handle error silently
    }
  }, [])

  const handleEditVendor = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingVendor) return
    const form = e.currentTarget
    const formData = new FormData(form)
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      category: formData.get("category") as string || null,
    }
    try {
      const res = await fetch(`/api/vendors/${editingVendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const vRes = await fetch("/api/vendors")
        const vData = await vRes.json()
        const vArr = vData.data || (Array.isArray(vData) ? vData : [])
        useERPStore.getState().setVendors(vArr)
        setEditingVendor(null)
        // Update detail if same vendor
        if (selectedVendor?.id === editingVendor.id) {
          const updated = vArr.find((v: Vendor) => v.id === editingVendor.id)
          if (updated) setSelectedVendor(updated)
        }
      }
    } catch {
      // handle error silently
    }
  }, [editingVendor, selectedVendor])

  const handleDeleteVendor = useCallback(async (vendorId: string) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      })
      if (res.ok) {
        const vRes = await fetch("/api/vendors")
        const vData = await vRes.json()
        const vArr = vData.data || (Array.isArray(vData) ? vData : [])
        useERPStore.getState().setVendors(vArr)
        setDeleteConfirm(null)
        if (selectedVendor?.id === vendorId) setSelectedVendor(null)
      }
    } catch {
      // handle error silently
    }
  }, [selectedVendor])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground text-sm">Manage suppliers and vendor relationships</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAddVendor(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Vendor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Vendors", value: totalVendors, icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active", value: activeVendors, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Total PO Value", value: `$${totalPOValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg. Rating", value: avgRating.toFixed(1), icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="h-9">
            {VENDOR_CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-3">{cat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 w-56"
          />
        </div>
      </div>

      {/* Vendor Grid */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No vendors found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredVendors.map((vendor, idx) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                poCount={purchaseOrders.filter(po => po.vendorId === vendor.id).length}
                onClick={() => setSelectedVendor(vendor)}
                onEdit={() => setEditingVendor(vendor)}
                onDelete={() => setDeleteConfirm(vendor.id)}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Vendor Detail Sheet */}
      <Sheet open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedVendor && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg flex items-center gap-2">
                  {selectedVendor.name}
                  {!selectedVendor.isActive && (
                    <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Inactive</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-6 pr-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={selectedVendor.category} />
                      <StarRating rating={selectedVendor.rating} size="md" />
                    </div>

                    <div className="space-y-2">
                      {selectedVendor.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={`mailto:${selectedVendor.email}`} className="text-emerald-700 hover:underline">
                            {selectedVendor.email}
                          </a>
                        </div>
                      )}
                      {selectedVendor.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{selectedVendor.phone}</span>
                        </div>
                      )}
                      {selectedVendor.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{selectedVendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium">Total Spend</p>
                      <p className="text-lg font-bold text-emerald-800">${vendorTotalSpend.toLocaleString()}</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                      <p className="text-xs text-teal-700 font-medium">Purchase Orders</p>
                      <p className="text-lg font-bold text-teal-800">{vendorPOs.length}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Recent POs */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald-600" />
                      Recent Purchase Orders
                    </h3>
                    {vendorPOs.length > 0 ? (
                      <div className="space-y-2">
                        {vendorPOs.slice(0, 8).map(po => (
                          <div key={po.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                            <div>
                              <p className="text-sm font-medium">{po.number}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(po.orderDate).toLocaleDateString()} · {po.poItems?.length || 0} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">${po.total.toLocaleString()}</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  po.status === "received" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  po.status === "sent" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  po.status === "cancelled" ? "bg-red-50 text-red-600 border-red-200" :
                                  "bg-slate-50 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#38383a]"
                                }`}
                              >
                                {po.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No purchase orders yet</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVendor(selectedVendor)
                        setSelectedVendor(null)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setDeleteConfirm(selectedVendor.id)
                        setSelectedVendor(null)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Deactivate
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Vendor Name</Label>
              <Input id="add-name" name="name" required placeholder="e.g. Office Depot" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" name="email" type="email" placeholder="vendor@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" name="phone" placeholder="+1 555-0100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Textarea id="add-address" name="address" placeholder="Full address..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Select name="category" defaultValue="Office Supplies">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.filter(c => c !== "All").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddVendor(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={!!editingVendor} onOpenChange={(open) => !open && setEditingVendor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          {editingVendor && (
            <form onSubmit={handleEditVendor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Vendor Name</Label>
                <Input id="edit-name" name="name" required defaultValue={editingVendor.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingVendor.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editingVendor.phone || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea id="edit-address" name="address" defaultValue={editingVendor.address || ""} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select name="category" defaultValue={editingVendor.category || "Office Supplies"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.filter(c => c !== "All").map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingVendor(null)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  <Pencil className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate Vendor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate this vendor? They will be marked as inactive but their data will be preserved.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteVendor(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* Sub-components */

function VendorCard({
  vendor,
  poCount,
  onClick,
  onEdit,
  onDelete,
  index,
}: {
  vendor: Vendor
  poCount: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-200 group"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {vendor.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-emerald-700 transition-colors">
                  {vendor.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CategoryBadge category={vendor.category} />
                  {!vendor.isActive && (
                    <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
          </div>

          {/* Contact */}
          <div className="space-y-1">
            {vendor.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{vendor.phone}</span>
              </div>
            )}
          </div>

          {/* Rating & Stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            <StarRating rating={vendor.rating} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShoppingCart className="h-3 w-3" />
              <span>{poCount} order{poCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
