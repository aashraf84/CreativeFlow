# Task 5 - Content Pipeline (Kanban) View

## Agent: full-stack-developer

## Summary
Built a professional Kanban board component for the VortexERP Content Pipeline view.

## Files Created/Modified
- **Created**: `src/components/erp/pipeline-view.tsx` — Complete Kanban/list pipeline view (main deliverable)
- **Created**: `src/components/erp/dissemination-view.tsx` — Placeholder to fix missing module error

## Key Implementation Details

### PipelineView Component (`src/components/erp/pipeline-view.tsx`)
- **Top Bar**: 3 filter dropdowns (Type, Priority, Team) + view toggle (Kanban/List) + Add Content button
- **6 Kanban Columns**: Idea (slate) → Design (violet) → Edit (amber) → Review (cyan) → Approve (emerald) → Disseminate (teal)
- **Content Cards**: Type badge, priority dot, title, campaign, tags, assignee avatar, due date, comment count, move-next button
- **List View**: Grid rows with stage badge, content, priority, assignee, due date, action
- **Move to Next Stage**: Optimistic store update + PUT `/api/contents/${id}` with rollback on failure
- **Animations**: Framer-motion staggered column/card entrance, hover action reveals

### Stage Colors
| Stage | Color | Icon |
|-------|-------|------|
| Idea | slate | Lightbulb |
| Design | violet | PenTool |
| Edit | amber | Pencil |
| Review | cyan | Eye |
| Approve | emerald | CheckCircle2 |
| Disseminate | teal | Send |

## Dependencies
- Uses existing PUT endpoint at `/api/contents/[id]` (already existed, supports stage updates)
- Uses Zustand store from `@/lib/store`
- Uses shadcn/ui components: Badge, Button, Avatar, Tooltip, DropdownMenu
- Uses framer-motion for animations
- Uses lucide-react for icons
