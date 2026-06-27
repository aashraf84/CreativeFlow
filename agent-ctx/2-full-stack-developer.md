---
Task ID: 2
Agent: full-stack-developer
Task: Add communication database models and API endpoints

Work Log:
- Added 4 new models to Prisma schema: CommunicationTemplate, Conversation, CommunicationMessage, CommunicationContact
- Added reverse relations to Organization model (communicationTemplates, conversations, communicationMessages, communicationContacts)
- Added reverse relations to User model (conversationsAssigned, messagesSent)
- Added reverse relations to Client model (conversations, communicationContacts)
- Added reverse relations to Influencer model (conversations, communicationContacts)
- Added reverse relations to Campaign model (conversations)
- Added `messages CommunicationMessage[]` to CommunicationTemplate model
- Added `organization Organization @relation(...)` to CommunicationMessage model (required for Prisma back-relation)
- Ran db:push successfully
- Created 9 API endpoint files:
  1. /api/communications/conversations/route.ts (GET list with filters + POST create with first message)
  2. /api/communications/conversations/[id]/route.ts (GET with all messages + PUT update)
  3. /api/communications/conversations/[id]/messages/route.ts (GET paginated + POST send message)
  4. /api/communications/email/send/route.ts (POST send direct email)
  5. /api/communications/whatsapp/send/route.ts (POST send WhatsApp message)
  6. /api/communications/templates/route.ts (GET list with filters + POST create)
  7. /api/communications/templates/[id]/route.ts (GET + PUT + DELETE)
  8. /api/communications/contacts/route.ts (GET list with search/filters + POST create)
  9. /api/communications/contacts/[id]/route.ts (GET with conversation history + PUT + DELETE)
- Ran lint check — no errors
- Dev server running cleanly

Stage Summary:
- 4 new DB models: CommunicationTemplate, Conversation, CommunicationMessage, CommunicationContact
- 5 existing models updated with reverse relations: Organization, User, Client, Influencer, Campaign
- 9 API endpoints covering email, WhatsApp, conversations, templates, and contacts
- All endpoints follow existing project patterns (db import, org lookup, error handling, pagination)
