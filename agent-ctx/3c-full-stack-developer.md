# Task 3c - Brand Kit View & Influencers View

## Agent: full-stack-developer

## Task
Build 2 professional views for VortexERP Social Media Agency platform:
1. `src/components/erp/brand-kit-view.tsx` - Brand Kit Manager
2. `src/components/erp/influencers-view.tsx` - Influencer CRM

## Work Completed

### Brand Kit View
- Full professional brand guideline manager inspired by Frontify/Brandfolder
- Client selector dropdown (Organization vs client-specific brand kits)
- 5 tabbed sections with count badges: Colors, Typography, Logos, Voice & Tone, Guidelines
- **Colors**: Swatches grouped by Primary/Secondary/Accent/Neutral, click-to-copy hex, add/edit/delete
- **Typography**: Font cards with live preview, weight chips, categorized as Heading/Body/Accent
- **Logos**: Variant grid (Primary/Secondary/Icon/Monochrome), light/dark background preview, download/upload
- **Voice & Tone**: Voice description, Do's/Don'ts columns, key phrases/taglines with badges
- **Guidelines**: Document cards with type badges, upload/download support
- 5 add dialogs + 1 edit dialog, all with emerald-themed styling
- Full CRUD via /api/brand-kit endpoints
- Framer-motion animations, responsive, emerald/teal primary

### Influencers View
- Professional CRM inspired by AspireIQ/CreatorIQ
- 4 KPI cards: Total Influencers, Active Collaborations, Avg Engagement Rate, Total Reach
- Platform filter buttons with brand colors (Instagram, TikTok, YouTube, etc.)
- Status filter tabs with counts (All, Prospect, Contacted, Negotiating, Active, Completed, Declined)
- Grid/List view toggle with AnimatePresence transitions
- Influencer cards: avatar with platform color, stats grid, engagement progress bar, niche badges, client assignment, quick actions
- Influencer list items for compact view
- Detail panel: profile, stats with animated engagement bar, contact, contract info, assignments
- Status timeline visualization with progress indicators
- Notes section with inline save
- Add Influencer dialog with comprehensive form
- Status update dropdown in detail panel
- Full CRUD via /api/influencers endpoints
- Framer-motion animations, responsive, emerald/teal primary

## Verification
- `bun run lint`: Passes (0 errors, 1 pre-existing warning in assets-view.tsx)
- Dev server compiles and serves both views
- All API endpoints return 200 OK
