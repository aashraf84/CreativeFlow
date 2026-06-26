# Task 7-b: Analytics, Automation, Archive, and Settings Views

## Agent: full-stack-developer

## Task
Build 4 view components for VortexERP Social Media Agency ERP system:
1. Analytics & Insights dashboard
2. Automation Rules manager
3. Content Archive browser
4. Settings page

## Work Completed

### 1. analytics-view.tsx
- Date range selector (7d, 30d, 90d, Custom)
- 4 KPI cards: Total Reach, Engagement Rate, Content Published, Avg. Response Time
- 4 recharts: Engagement Over Time (Line), Content by Type (Donut), Platform Comparison (Bar), Pipeline Funnel (Horizontal Bar)
- Top Performing Posts table (top 5)
- Team Output Bar chart
- Emerald/teal color palette, framer-motion animations

### 2. automation-view.tsx
- Active count badge + Create Rule button
- Expandable rule cards with trigger/action badges, Switch toggle
- Create/Edit Dialog form with conditions builder and actions builder
- 4 quick-add templates
- Delete confirmation AlertDialog
- Emerald/teal accents

### 3. archive-view.tsx
- Stats row: Total Archived, Archived This Month, Storage Used
- Search + Type/Campaign/Team filters
- Grid/List view toggle
- Bulk actions: select multiple, restore, delete
- Restore moves to "idea" stage
- Emerald/teal accents, red for destructive

### 4. settings-view.tsx
- Organization Settings (name, logo, plan, limits)
- User Profile (avatar, name, email, role)
- Notification Preferences (6 toggles)
- Workspace (team, view, timezone, language)
- Integrations (8 platforms, Connect/Disconnect)
- Danger Zone (reset data, delete account)
- Emerald/teal save buttons, red danger zone

## Verification
- ESLint passes with zero errors
- Dev server compiles successfully
- All components use "use client", import from @/lib/store and @/components/ui/*
