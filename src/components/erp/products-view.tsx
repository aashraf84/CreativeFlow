"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Product, type StockMovement } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Package, Search, Plus, LayoutGrid, List, AlertTriangle,
  TrendingUp, Warehouse, DollarSign, ArrowRightLeft,
  ChevronRight, ArrowDownCircle, ArrowUpCircle, RotateCcw, Settings2,
  PackageCheck, PackageX
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const CATEGORIES = ["All", "Stationery", "Electronics", "Print Materials", "Merchandise", "Software"]

function getStockStatus(product: Product) {
  const totalQty = product.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
  if (totalQty === 0) return "out" as const
  if (totalQty <= product.reorderLevel) return "low" as const
  return "ok" as const
}

function StockIndicator({ status }: { status: "ok" | "low" | "out" }) {
  const config = {
    ok: { color: "bg-emerald-500", label: "In Stock", textColor: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-50 dark:bg-emerald-900/40" },
    low: { color: "bg-amber-500", label: "Low Stock", textColor: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-50 dark:bg-amber-900/40" },
    out: { color: "bg-red-500", label: "Out of Stock", textColor: "text-red-700 dark:text-red-300", bgColor: "bg-red-50 dark:bg-red-900/40" },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bgColor} ${c.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
      {c.label}
    </span>
  )
}

export function ProductsView() {
  const { products, warehouses, stockMovements } = useERPStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showStockMovement, setShowStockMovement] = useState(false)

  // Computed values
  const totalProducts = products.length
  const lowStockItems = products.filter(p => {
    const qty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
    return qty > 0 && qty <= p.reorderLevel
  }).length
  const outOfStockItems = products.filter(p => {
    const qty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
    return qty === 0
  }).length
  const totalValue = products.reduce((sum, p) => {
    const qty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
    return sum + qty * p.costPrice
  }, 0)

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = products
    if (categoryFilter !== "All") {
      result = result.filter(p => p.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    return result
  }, [products, categoryFilter, search])

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const qty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
      return qty <= p.reorderLevel
    })
  }, [products])

  // Product movements
  const productMovements = useMemo(() => {
    if (!selectedProduct) return []
    return stockMovements
      .filter(m => m.productId === selectedProduct.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [selectedProduct, stockMovements])

  const handleAddProduct = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const body = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      unit: formData.get("unit") as string,
      unitPrice: parseFloat(formData.get("unitPrice") as string) || 0,
      costPrice: parseFloat(formData.get("costPrice") as string) || 0,
      reorderLevel: parseInt(formData.get("reorderLevel") as string) || 0,
    }
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        useERPStore.getState().setProducts([...products, data.product || data])
        setShowAddProduct(false)
        toast.success("Product added successfully!")
        form.reset()
      } else {
        toast.error("Failed to add product")
      }
    } catch {
      toast.error("Failed to add product")
    }
  }, [products])

  const handleStockMovement = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const body = {
      productId: formData.get("productId") as string,
      warehouseId: formData.get("warehouseId") as string,
      type: formData.get("type") as string,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      reference: formData.get("reference") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    }
    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        // Refresh stock movements
        const smRes = await fetch("/api/stock-movements")
        const smData = await smRes.json()
        const smArr = smData.data || (Array.isArray(smData) ? smData : [])
        useERPStore.getState().setStockMovements(smArr)
        // Refresh products for updated stock levels
        const pRes = await fetch("/api/products")
        const pData = await pRes.json()
        const pArr = pData.data || (Array.isArray(pData) ? pData : [])
        useERPStore.getState().setProducts(pArr)
        setShowStockMovement(false)
        toast.success("Stock movement recorded!")
      } else {
        toast.error("Failed to record stock movement")
      }
    } catch {
      toast.error("Failed to record stock movement")
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Products & Stock</h1>
          <p className="text-[#86868b] dark:text-[#aeaeb2] text-sm">Manage inventory, stock levels and movements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStockMovement(true)} className="rounded-lg">
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Stock Movement
          </Button>
          <Button size="sm" className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-md shadow-emerald-500/25 border-0" onClick={() => setShowAddProduct(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: totalProducts, icon: Package, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Low Stock Items", value: lowStockItems, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Total Value", value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/40" },
          { label: "Warehouses", value: warehouses.length, icon: Warehouse, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover hover-lift rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#86868b] dark:text-[#aeaeb2] font-medium uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-3xl font-bold mt-1 text-[#1d1d1f] dark:text-white tabular-nums">{kpi.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/40 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Alerts ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.map(p => {
                  const qty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
                  return (
                    <Badge
                      key={p.id}
                      variant="outline"
                      className="cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100"
                      onClick={() => setSelectedProduct(p)}
                    >
                      {p.name}: {qty} left (reorder at {p.reorderLevel})
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="h-9">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-3">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 w-56"
            />
          </div>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 w-9 p-0 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 w-9 p-0 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center">
              <PackageX className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Detail Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">{selectedProduct.name}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-6 pr-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">{selectedProduct.sku}</Badge>
                      {selectedProduct.category && (
                        <Badge variant="outline" className="text-xs">{selectedProduct.category}</Badge>
                      )}
                      <StockIndicator status={getStockStatus(selectedProduct)} />
                    </div>
                    {selectedProduct.description && (
                      <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Unit Price</p>
                        <p className="text-lg font-bold">${selectedProduct.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Cost Price</p>
                        <p className="text-lg font-bold">${selectedProduct.costPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Unit</p>
                        <p className="text-lg font-bold">{selectedProduct.unit}</p>
                      </div>
                      <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Reorder Level</p>
                        <p className="text-lg font-bold">{selectedProduct.reorderLevel}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stock Levels per Warehouse */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-emerald-600" />
                      Stock by Warehouse
                    </h3>
                    {selectedProduct.stockLevels && selectedProduct.stockLevels.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.stockLevels.map(sl => (
                          <div key={sl.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div>
                              <p className="text-sm font-medium">{sl.warehouse.name}</p>
                              <p className="text-xs text-muted-foreground">{sl.warehouse.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{sl.quantity}</p>
                              {sl.reservedQuantity > 0 && (
                                <p className="text-xs text-amber-600">{sl.reservedQuantity} reserved</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No stock levels recorded</p>
                    )}
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Stock</span>
                        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                          {selectedProduct.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Recent Movements */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                      Recent Movements
                    </h3>
                    {productMovements.length > 0 ? (
                      <div className="space-y-2">
                        {productMovements.map(m => (
                          <MovementItem key={m.id} movement={m} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent movements</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required placeholder="e.g. A4 Paper" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required placeholder="e.g. A4-PAP-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="Stationery">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" defaultValue="pcs">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="ltr">Liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" min="0" required placeholder="10" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={showStockMovement} onOpenChange={setShowStockMovement}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockMovement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select name="productId" required>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse</Label>
                <Select name="warehouseId" required>
                  <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" required defaultValue="in">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required placeholder="Enter quantity" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input id="reference" name="reference" placeholder="e.g. PO-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" name="notes" placeholder="Add notes..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowStockMovement(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Record Movement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* Sub-components */

function ProductCard({ product, onClick, index }: { product: Product; onClick: () => void; index: number }) {
  const totalQty = product.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
  const status = getStockStatus(product)
  const totalValue = totalQty * product.costPrice

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card
        className="cursor-pointer bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] hover:shadow-macos-lg hover-lift transition-all hover:border-emerald-300/40 dark:hover:border-emerald-500/30 group rounded-2xl"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate group-hover:text-emerald-700 transition-colors">
                {product.name}
              </p>
              <Badge variant="secondary" className="font-mono text-[10px] mt-1">{product.sku}</Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </div>

          <div className="flex items-center gap-2">
            {product.category && (
              <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
            )}
            <StockIndicator status={status} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Price</p>
              <p className="text-sm font-bold">${product.unitPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Cost</p>
              <p className="text-sm font-bold">${product.costPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Stock per warehouse mini bars */}
          {product.stockLevels && product.stockLevels.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium">Stock by Warehouse</p>
              {product.stockLevels.map(sl => {
                const maxQty = Math.max(sl.quantity, product.reorderLevel, 1)
                const pct = Math.min((sl.quantity / maxQty) * 100, 100)
                return (
                  <div key={sl.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 truncate">{sl.warehouse.code}</span>
                    <div className="flex-1 h-1.5 bg-black/[0.05] dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sl.quantity === 0 ? "bg-red-400" :
                          sl.quantity <= product.reorderLevel ? "bg-amber-400" :
                          "bg-emerald-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium w-8 text-right">{sl.quantity}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Total: {totalQty} {product.unit}</span>
            <span className="text-xs font-semibold text-teal-700">${totalValue.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProductListItem({ product, onClick }: { product: Product; onClick: () => void }) {
  const totalQty = product.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
  const status = getStockStatus(product)

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-colors rounded-xl"
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
        <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{product.sku}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {product.category && <span className="text-xs text-muted-foreground">{product.category}</span>}
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{product.unit}</span>
        </div>
      </div>
      <div className="hidden sm:block">
        <StockIndicator status={status} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">${product.unitPrice.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{totalQty} in stock</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}

function MovementItem({ movement }: { movement: StockMovement }) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    in: { icon: ArrowDownCircle, color: "text-emerald-600", label: "Stock In" },
    out: { icon: ArrowUpCircle, color: "text-red-500", label: "Stock Out" },
    adjustment: { icon: Settings2, color: "text-amber-600", label: "Adjustment" },
    return: { icon: RotateCcw, color: "text-teal-600", label: "Return" },
  }
  const cfg = typeConfig[movement.type] || typeConfig.adjustment
  const Icon = cfg.icon

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
      <Icon className={`h-4 w-4 ${cfg.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{cfg.label}</span>
          <span className="text-xs text-muted-foreground">× {movement.quantity}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {movement.warehouse.name} · {movement.reference || "No ref"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {new Date(movement.createdAt).toLocaleDateString()}
        </p>
        {movement.notes && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{movement.notes}</p>
        )}
      </div>
    </div>
  )
}
