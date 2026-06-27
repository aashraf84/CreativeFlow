# Task 3b - InvoicingView and AssetsView

## Summary
Built two professional views for VortexERP Social Media Agency platform.

## Files Modified
1. `src/components/erp/invoicing-view.tsx` - Full professional invoicing & billing view
2. `src/components/erp/assets-view.tsx` - Full professional digital asset library view

## InvoicingView Features
- Top KPI Row (4 cards): Total Revenue, Paid, Outstanding, Overdue Invoices
- Revenue Chart (6-month bar chart with recharts)
- Tabs: Invoices / Time Tracking
- Invoice table with expand/collapse details, status badges, actions dropdown
- Create Invoice Dialog with dynamic line items, auto-calc, tax rate
- Time Tracking tab with weekly summary, entries table, add time entry dialog
- Full API integration with /api/invoices and /api/time-entries

## AssetsView Features
- Top Stats (5 cards): Total Assets, Images, Videos, Templates, Storage
- View Toggle: Grid / List
- Collapsible left sidebar with folder navigation + client folders
- Upload drop zone visual
- Asset grid with gradient placeholders, type-based color coding
- Asset list view with table layout
- Right-side detail panel with preview, file info, tags, metadata
- Upload and Edit dialogs
- Search & filter by type, client
- Full API integration with /api/assets

## Design
- Emerald/teal primary, NO blue/indigo
- Framer-motion animations
- Responsive design (mobile cards, desktop grids)
- Type-based color coding (images=emerald, videos=rose, documents=amber, templates=violet, fonts=cyan)

## Lint
- Zero errors after fixes (resetForm/resetTimeForm ordering, ImageIcon rename)
