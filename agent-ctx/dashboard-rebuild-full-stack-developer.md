# Task: dashboard-rebuild
# Agent: full-stack-developer

## Summary
Completely rebuilt the dashboard view at `/home/z/my-project/src/components/erp/dashboard-view.tsx` to remove all finance-related content and add an animated pipeline workflow as the hero section.

## Changes Made
1. **Removed**: All recharts imports (BarChart, PieChart, Cell, Legend, etc.)
2. **Removed**: Finance KPI cards (Revenue, Unread Inbox, Time Tracked)
3. **Removed**: Revenue Overview chart, Approval Status pie chart, Content Pipeline bar chart, Platform Performance bar chart
4. **Added**: 6 work-related KPI cards in a responsive grid
5. **Added**: Animated pipeline workflow with 6 stages, flowing dot connectors, responsive layout
6. **Added**: Tasks & Dissemination Queue with assignee, priority, due date, platform icons
7. **Added**: Enhanced Team Performance with sparkline indicators
8. **Added**: CSS-based Platform Activity visualization
9. **Updated**: Quick Actions to work-related only
10. **Updated**: Loading skeleton for new layout

## Files Modified
- `src/components/erp/dashboard-view.tsx` - Complete rewrite

## No Errors
- Lint passed with no issues
- Dev server compiled successfully
- No runtime errors in dev.log
