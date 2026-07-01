"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type PurchaseOrder, type PurchaseOrderItem } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShoppingCart, Search, Plus, Truck, Clock, DollarSign,
  ChevronDown, ChevronUp, FileText, Package, Send,
  CheckCircle2, XCircle, Trash2, AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const STATUS_TABS = ["All", "Draft", "Sent", "Partial", "Received", "Cancelled"]

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    draft: { className: "bg-slate-100 dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#38383a]", label: "Draft" },
    sent: { className: "bg-amber-50 text-amber-700 border-amber-200", label: "Sent" },
    partial: { className: "bg-teal-50 text-teal-700 border-teal-200", label: "Partial" },
    received: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Received" },
    cancelled: { className: "bg-red-50 text-red-600 border-red-200", label: "Cancelled" },
  }
  const cfg = config[status] || config.draft
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

interface LineItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export function PurchaseOrdersView() {
  const { purchaseOrders, vendors, products } = useERPStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [expandedPO, setExpandedPO] = useState<string | null>(null)
  const [showCreatePO, setShowCreatePO] = useState(false)

  // Create PO form state
  const [poVendorId, setPoVendorId] = useState("")
  const [poNotes, setPoNotes] = useState("")
  const [poLineItems, setPoLineItems] = useState<LineItemInput[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ])

  // Computed KPIs
  const totalPOs = purchaseOrders.length
  const pendingPOs = purchaseOrders.filter(po => po.status === "draft" || po.status === "sent").length
  const inTransitPOs = purchaseOrders.filter(po => po.status === "partial").length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0)

  // Filtered POs
  const filteredPOs = useMemo(() => {
    let result = [...purchaseOrders].sort((a, b) =>
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    )
    if (statusFilter !== "All") {
      result = result.filter(po => po.status === statusFilter.toLowerCase())
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(po =>
        po.number.toLowerCase().includes(q) ||
        po.vendor?.name.toLowerCase().includes(q)
      )
    }
    return result
  }, [purchaseOrders, statusFilter, search])

  // Line item helpers
  const addLineItem = () => {
    setPoLineItems([...poLineItems, { productId: "", quantity: 1, unitPrice: 0 }])
  }
  const removeLineItem = (idx: number) => {
    if (poLineItems.length <= 1) return
    setPoLineItems(poLineItems.filter((_, i) => i !== idx))
  }
  const updateLineItem = (idx: number, field: keyof LineItemInput, value: string | number) => {
    const updated = [...poLineItems]
    updated[idx] = { ...updated[idx], [field]: value }
    // Auto-fill unit price when product selected
    if (field === "productId" && typeof value === "string") {
      const prod = products.find(p => p.id === value)
      if (prod) {
        updated[idx].unitPrice = prod.costPrice
      }
    }
    setPoLineItems(updated)
  }
  const lineItemTotal = (item: LineItemInput) => item.quantity * item.unitPrice
  const poSubtotal = poLineItems.reduce((sum, item) => sum + lineItemTotal(item), 0)
  const poTax = poSubtotal * 0.1
  const poTotal = poSubtotal + poTax

  const handleCreatePO = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!poVendorId) return
    const validItems = poLineItems.filter(i => i.productId && i.quantity > 0)
    if (validItems.length === 0) return

    const body = {
      vendorId: poVendorId,
      notes: poNotes,
      items: validItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }
    const resetPOForm = () => {
      setPoVendorId("")
      setPoNotes("")
      setPoLineItems([{ productId: "", quantity: 1, unitPrice: 0 }])
    }

    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const poRes = await fetch("/api/purchase-orders")
        const poData = await poRes.json()
        const poArr = poData.data || (Array.isArray(poData) ? poData : [])
        useERPStore.getState().setPurchaseOrders(poArr)
        toast.success("Purchase order created")
        setShowCreatePO(false)
        resetPOForm()
      } else {
        toast.error("Failed to create purchase order")
      }
    } catch {
      toast.error("Failed to create purchase order")
    }
  }, [poVendorId, poNotes, poLineItems])

  const handleStatusChange = useCallback(async (poId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const poRes = await fetch("/api/purchase-orders")
        const poData = await poRes.json()
        const poArr = poData.data || (Array.isArray(poData) ? poData : [])
        useERPStore.getState().setPurchaseOrders(poArr)
        toast.success(`Purchase order marked as ${newStatus}`)
      } else {
        toast.error("Failed to update purchase order status")
      }
    } catch {
      toast.error("Failed to update purchase order status")
    }
  }, [])

  const toggleExpand = (poId: string) => {
    setExpandedPO(prev => prev === poId ? null : poId)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm">Manage procurement and vendor orders</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreatePO(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create PO
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total POs", value: totalPOs, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", value: pendingPOs, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "In Transit", value: inTransitPOs, icon: Truck, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Total Value", value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
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
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="h-9">
            {STATUS_TABS.map(s => (
              <TabsTrigger key={s} value={s} className="text-xs px-3">{s}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO number or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 w-56"
          />
        </div>
      </div>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No purchase orders found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredPOs.map((po, idx) => (
              <POCard
                key={po.id}
                po={po}
                isExpanded={expandedPO === po.id}
                onToggle={() => toggleExpand(po.id)}
                onStatusChange={handleStatusChange}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create PO Dialog */}
      <Dialog open={showCreatePO} onOpenChange={(open) => { setShowCreatePO(open); if (!open) resetPOForm() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePO} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={poVendorId} onValueChange={setPoVendorId} required>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <ScrollArea className="max-h-60">
                <div className="space-y-2 pr-2">
                  {poLineItems.map((item, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-2 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <Label className="text-[10px] text-muted-foreground">Product</Label>
                        <Select
                          value={item.productId}
                          onValueChange={v => updateLineItem(idx, "productId", v)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label className="text-[10px] text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          className="h-8 text-xs"
                          value={item.quantity}
                          onChange={e => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-[10px] text-muted-foreground">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8 text-xs"
                          value={item.unitPrice}
                          onChange={e => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-[10px] text-muted-foreground">Total</Label>
                        <p className="h-8 flex items-center text-xs font-semibold">
                          ${lineItemTotal(item).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => removeLineItem(idx)}
                        disabled={poLineItems.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${poSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${poTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-emerald-700">${poTotal.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreatePO(false); resetPOForm() }}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={!poVendorId}>
                <FileText className="h-4 w-4 mr-1" />
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* Sub-components */

function POCard({
  po,
  isExpanded,
  onToggle,
  onStatusChange,
  index,
}: {
  po: PurchaseOrder
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string) => void
  index: number
}) {
  const itemCount = po.poItems?.length || 0
  const isActionable = po.status === "draft" || po.status === "sent" || po.status === "partial"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Main row */}
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{po.number}</span>
                <StatusBadge status={po.status} />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{po.vendor?.name || "Unknown"}</span>
                <span>·</span>
                <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{new Date(po.orderDate).toLocaleDateString()}</span>
                {po.expectedDate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Truck className="h-3 w-3" />
                      {new Date(po.expectedDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">${po.total.toLocaleString()}</p>
            </div>
            <div className="shrink-0">
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t px-4 py-3 space-y-3">
                  {/* Line Items Table */}
                  {po.poItems && po.poItems.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Product</th>
                            <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">Qty</th>
                            <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Unit Price</th>
                            <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.poItems.map((item: PurchaseOrderItem) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="font-medium">{item.product?.name || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="text-center px-3 py-2">{item.quantity}</td>
                              <td className="text-right px-3 py-2">${item.unitPrice.toFixed(2)}</td>
                              <td className="text-right px-3 py-2 font-semibold">${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Subtotal</span>
                      <p className="font-semibold">${po.subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tax</span>
                      <p className="font-semibold">${po.tax.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Date</span>
                      <p className="font-semibold">{new Date(po.orderDate).toLocaleDateString()}</p>
                    </div>
                    {po.expectedDate && (
                      <div>
                        <span className="text-muted-foreground">Expected Date</span>
                        <p className="font-semibold">{new Date(po.expectedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {po.notes && (
                    <div className="text-xs bg-muted/50 rounded-lg p-2">
                      <span className="text-muted-foreground">Notes: </span>
                      {po.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isActionable && (
                    <div className="flex items-center gap-2 pt-1">
                      {po.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(po.id, "sent")} className="text-amber-700 border-amber-200 hover:bg-amber-50">
                          <Send className="h-3.5 w-3.5 mr-1" /> Mark Sent
                        </Button>
                      )}
                      {(po.status === "sent" || po.status === "partial") && (
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(po.id, "received")} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Received
                        </Button>
                      )}
                      {po.status !== "cancelled" && (
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(po.id, "cancelled")} className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
