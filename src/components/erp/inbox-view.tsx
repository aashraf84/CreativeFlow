"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  useERPStore,
  type Conversation,
  type CommunicationMessage,
  type CommunicationTemplate,
  type CommunicationContact,
} from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import {
  Inbox,
  Mail,
  MessageCircle,
  PenSquare,
  FileText,
  Users,
  BarChart3,
  Search,
  Send,
  Star,
  StarOff,
  Archive,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Eye,
  Phone,
  Heart,
  Tag,
  Plus,
  Sparkles,
  Hash,
  StickyNote,
  Filter,
  ChevronRight,
  User,
  Building2,
  Globe,
  Zap,
  TrendingUp,
  MessageSquare,
  MailCheck,
  Timer,
  ArrowUpRight,
  X,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

// ─── Helpers ────────────────────────────────────────────────────────
function parseJsonSafe(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    if (typeof val === "string" && val.length > 0) {
      return val.split(",").map(s => s.trim()).filter(Boolean)
    }
    return []
  }
}

function detectVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const vars: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1])
  }
  return vars
}

function substituteVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`)
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function getRoleGradient(role: string | null): string {
  switch (role) {
    case "client": return "from-emerald-400 to-teal-500"
    case "influencer": return "from-pink-400 to-rose-500"
    case "partner": return "from-amber-400 to-orange-500"
    case "vendor": return "from-violet-400 to-purple-500"
    default: return "from-slate-400 to-slate-500"
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "bg-red-500"
    case "high": return "bg-orange-500"
    case "normal": return "bg-emerald-500"
    case "low": return "bg-slate-400"
    default: return "bg-slate-400"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered": return <Check className="h-3 w-3 text-muted-foreground" />
    case "read": case "opened": return <CheckCheck className="h-3 w-3 text-emerald-500" />
    case "failed": case "bounced": return <AlertCircle className="h-3 w-3 text-red-500" />
    default: return <Check className="h-3 w-3 text-muted-foreground/50" />
  }
}

// ─── Refresh helpers ────────────────────────────────────────────────
async function refreshConversations() {
  try {
    const res = await fetch("/api/communications/conversations")
    const json = await res.json()
    const data = json?.conversations || json?.data || (Array.isArray(json) ? json : [])
    if (Array.isArray(data)) useERPStore.getState().setConversations(data as Conversation[])
  } catch (e) { console.error("Refresh conversations error:", e) }
}

async function refreshTemplates() {
  try {
    const res = await fetch("/api/communications/templates")
    const json = await res.json()
    const data = json?.templates || json?.data || (Array.isArray(json) ? json : [])
    if (Array.isArray(data)) useERPStore.getState().setCommunicationTemplates(data as CommunicationTemplate[])
  } catch (e) { console.error("Refresh templates error:", e) }
}

async function refreshContacts() {
  try {
    const res = await fetch("/api/communications/contacts")
    const json = await res.json()
    const data = json?.contacts || json?.data || (Array.isArray(json) ? json : [])
    if (Array.isArray(data)) useERPStore.getState().setCommunicationContacts(data as CommunicationContact[])
  } catch (e) { console.error("Refresh contacts error:", e) }
}

// ─── Main Component ─────────────────────────────────────────────────
export function InboxView() {
  const {
    conversations, communicationTemplates, communicationContacts, currentUser,
  } = useERPStore()

  const [activeTab, setActiveTab] = useState("inbox")

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Inbox className="h-6 w-6 text-emerald-500" />
            Communication Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage emails, WhatsApp messages, templates, contacts & analytics
          </p>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 px-4 sm:px-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex bg-muted/50 p-1 rounded-lg mb-4">
          <TabsTrigger value="inbox" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Inbox className="h-3.5 w-3.5" />Inbox
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <PenSquare className="h-3.5 w-3.5" />Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <FileText className="h-3.5 w-3.5" />Templates
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5" />Contacts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <BarChart3 className="h-3.5 w-3.5" />Analytics
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="inbox" className="h-full m-0">
            <InboxTab conversations={conversations} currentUser={currentUser} />
          </TabsContent>
          <TabsContent value="compose" className="h-full m-0 overflow-y-auto">
            <ComposeTab templates={communicationTemplates} contacts={communicationContacts} currentUser={currentUser} />
          </TabsContent>
          <TabsContent value="templates" className="h-full m-0 overflow-y-auto">
            <TemplatesTab templates={communicationTemplates} />
          </TabsContent>
          <TabsContent value="contacts" className="h-full m-0 overflow-y-auto">
            <ContactsTab contacts={communicationContacts} />
          </TabsContent>
          <TabsContent value="analytics" className="h-full m-0 overflow-y-auto">
            <AnalyticsTab conversations={conversations} templates={communicationTemplates} contacts={communicationContacts} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 1: INBOX — Split Panel
// ═══════════════════════════════════════════════════════════════════════
function InboxTab({ conversations, currentUser }: { conversations: Conversation[]; currentUser: { id: string; name: string; email: string } | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")

  const filtered = useMemo(() => {
    return conversations.filter(c => {
      if (channelFilter !== "all" && c.type !== channelFilter) return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const matchSubject = c.subject?.toLowerCase().includes(s)
        const matchPreview = c.lastMessagePreview?.toLowerCase().includes(s)
        const matchClient = c.client?.name?.toLowerCase().includes(s)
        const matchInfluencer = c.influencer?.name?.toLowerCase().includes(s)
        return matchSubject || matchPreview || matchClient || matchInfluencer
      }
      return true
    })
  }, [conversations, search, channelFilter, statusFilter])

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null
    return conversations.find(c => c.id === selectedId) || null
  }, [conversations, selectedId])

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Left Panel - Conversation List */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "email", "whatsapp", "mixed"] as const).map(ch => (
              <Button
                key={ch}
                variant={channelFilter === ch ? "default" : "ghost"}
                size="sm"
                className={`h-7 text-xs px-2.5 ${channelFilter === ch ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                onClick={() => setChannelFilter(ch)}
              >
                {ch === "all" ? <Inbox className="h-3 w-3 mr-1" /> : ch === "email" ? <Mail className="h-3 w-3 mr-1" /> : ch === "whatsapp" ? <MessageCircle className="h-3 w-3 mr-1" /> : <Hash className="h-3 w-3 mr-1" />}
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["active", "archived", "closed", "all"] as const).map(st => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "ghost"}
                size="sm"
                className={`h-7 text-xs px-2.5 ${statusFilter === st ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(conv => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Conversation Detail */}
      <div className="flex-1 border rounded-xl bg-card overflow-hidden flex flex-col min-h-[400px]">
        {selectedConversation ? (
          <ConversationDetail conversation={selectedConversation} currentUser={currentUser} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Select a conversation to view details</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Conversation Card ──────────────────────────────────────────────
function ConversationCard({ conversation, isSelected, onClick }: {
  conversation: Conversation; isSelected: boolean; onClick: () => void
}) {
  const lastMsg = conversation.messages?.[0]
  const tags = parseJsonSafe(conversation.tags)
  const hasStarred = conversation.messages?.some(m => m.isStarred)

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${isSelected ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500" : "border-l-4 border-l-transparent"}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 mt-0.5">
          {conversation.type === "email" ? (
            <Mail className="h-4 w-4 text-emerald-500" />
          ) : conversation.type === "whatsapp" ? (
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
          ) : (
            <div className="flex gap-0.5">
              <Mail className="h-3.5 w-3.5 text-emerald-500" />
              <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityColor(conversation.priority)}`} />
            <span className="text-sm font-medium truncate">
              {conversation.subject || (conversation.type === "whatsapp" ? "(WhatsApp)" : "(No Subject)")}
            </span>
            {hasStarred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessagePreview || lastMsg?.body?.substring(0, 80) || "No messages"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground/70">{lastMsg?.senderName || "Unknown"}</span>
            {conversation.client && (
              <Badge variant="outline" className="h-4 text-[10px] px-1 border-emerald-300 text-emerald-600">
                {conversation.client.name}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground/50 ml-auto">
              {conversation.lastMessageAt ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true }) : ""}
            </span>
            {conversation.unreadCount > 0 && (
              <Badge className="h-4 min-w-[18px] text-[10px] px-1 bg-red-500 text-white">{conversation.unreadCount}</Badge>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {tags.slice(0, 3).map(t => (
                <Badge key={t} variant="secondary" className="h-4 text-[9px] px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mt-2" />
      </div>
    </motion.button>
  )
}

// ─── Conversation Detail ────────────────────────────────────────────
function ConversationDetail({ conversation, currentUser }: {
  conversation: Conversation; currentUser: { id: string; name: string; email: string } | null
}) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [composeType, setComposeType] = useState<string>(conversation.type === "whatsapp" ? "whatsapp" : "email")
  const [composeBody, setComposeBody] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [sending, setSending] = useState(false)
  const [priority, setPriority] = useState(conversation.priority)
  const [status, setStatus] = useState(conversation.status)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [conversation.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communications/conversations/${conversation.id}`)
      const json = await res.json()
      if (json.conversation?.messages) {
        setMessages(json.conversation.messages)
      }
    } catch (e) {
      console.error("Load messages error:", e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!composeBody.trim()) return
    setSending(true)
    try {
      const payload: Record<string, unknown> = {
        body: composeBody,
        type: composeType,
        senderId: currentUser?.id || "user-admin",
        senderName: currentUser?.name || "Sarah Chen",
      }
      if (composeType === "email") {
        payload.recipientEmail = conversation.messages?.[0]?.recipientEmail || conversation.messages?.[0]?.senderEmail || ""
        payload.subject = composeSubject || conversation.subject || ""
        payload.recipientName = conversation.messages?.[0]?.recipientName || conversation.messages?.[0]?.senderName || ""
      } else if (composeType === "whatsapp") {
        payload.recipientPhone = conversation.messages?.find(m => m.recipientPhone)?.recipientPhone || conversation.messages?.find(m => m.senderPhone)?.senderPhone || ""
        payload.recipientName = conversation.messages?.[0]?.recipientName || conversation.messages?.[0]?.senderName || ""
      }

      await fetch(`/api/communications/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setComposeBody("")
      setComposeSubject("")
      await loadMessages()
      await refreshConversations()
    } catch (e) {
      console.error("Send message error:", e)
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateConversation(field: string, value: string) {
    try {
      await fetch(`/api/communications/conversations/${conversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (field === "priority") setPriority(value)
      if (field === "status") setStatus(value)
      await refreshConversations()
    } catch (e) {
      console.error("Update conversation error:", e)
    }
  }

  async function toggleStar(msgId: string, current: boolean) {
    // Note: there's no dedicated star API, but we simulate by using the message structure
    // For now just update locally — in production you'd call an API
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: !current } : m))
  }

  const tags = parseJsonSafe(conversation.tags)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold truncate">
                {conversation.subject || (conversation.type === "whatsapp" ? "(WhatsApp)" : "(No Subject)")}
              </h2>
              <ChannelBadge type={conversation.type} />
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              {conversation.client && (
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{conversation.client.name}</span>
              )}
              {conversation.influencer && (
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{conversation.influencer.name}</span>
              )}
              {conversation.assignedTo && (
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{conversation.assignedTo.name}</span>
              )}
              {tags.length > 0 && tags.map(t => (
                <Badge key={t} variant="secondary" className="h-4 text-[10px] px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  <Tag className="h-2.5 w-2.5 mr-0.5" />{t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={priority} onValueChange={v => handleUpdateConversation("priority", v)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Urgent</span></SelectItem>
                <SelectItem value="high"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" />High</span></SelectItem>
                <SelectItem value="normal"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Normal</span></SelectItem>
                <SelectItem value="low"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" />Low</span></SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => handleUpdateConversation("status", v)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onToggleStar={() => toggleStar(msg.id, msg.isStarred)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Compose Area */}
      <div className="border-t p-3 bg-muted/10">
        <div className="flex gap-1.5 mb-2">
          {(conversation.type === "email" || conversation.type === "mixed") && (
            <Button
              variant={composeType === "email" ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs ${composeType === "email" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
              onClick={() => setComposeType("email")}
            >
              <Mail className="h-3 w-3 mr-1" />Email
            </Button>
          )}
          {(conversation.type === "whatsapp" || conversation.type === "mixed") && (
            <Button
              variant={composeType === "whatsapp" ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs ${composeType === "whatsapp" ? "bg-[#25D366] hover:bg-[#20bd5a] text-white" : ""}`}
              onClick={() => setComposeType("whatsapp")}
            >
              <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
            </Button>
          )}
          <Button
            variant={composeType === "note" ? "default" : "outline"}
            size="sm"
            className={`h-7 text-xs ${composeType === "note" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
            onClick={() => setComposeType("note")}
          >
            <StickyNote className="h-3 w-3 mr-1" />Note
          </Button>
        </div>
        {composeType === "email" && (
          <Input
            placeholder="Subject"
            value={composeSubject}
            onChange={e => setComposeSubject(e.target.value)}
            className="h-8 text-sm mb-2"
          />
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder={composeType === "whatsapp" ? "Type a WhatsApp message..." : composeType === "note" ? "Add an internal note..." : "Type your email reply..."}
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              className="min-h-[60px] text-sm resize-none pr-16"
              rows={2}
            />
            {composeType === "whatsapp" && (
              <span className={`absolute bottom-2 right-2 text-[10px] ${composeBody.length > 3800 ? "text-red-500" : "text-muted-foreground"}`}>
                {composeBody.length}/4096
              </span>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={!composeBody.trim() || sending}
            className={`self-end h-10 ${composeType === "whatsapp" ? "bg-[#25D366] hover:bg-[#20bd5a]" : composeType === "note" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ message, onToggleStar }: {
  message: CommunicationMessage; onToggleStar: () => void
}) {
  const isOutbound = message.direction === "outbound"
  const isNote = message.type === "note"
  const isWA = message.type === "whatsapp"

  let bubbleClass = ""
  if (isNote) {
    bubbleClass = "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
  } else if (isWA && isOutbound) {
    bubbleClass = "bg-[#DCF8C6] dark:bg-emerald-950/40 border border-[#25D366]/20"
  } else if (isWA && !isOutbound) {
    bubbleClass = "bg-white dark:bg-muted/50 border border-[#25D366]/10"
  } else if (isOutbound) {
    bubbleClass = "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
  } else {
    bubbleClass = "bg-white dark:bg-muted/50 border"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOutbound || isNote ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] rounded-xl p-3 ${bubbleClass}`}>
        <div className="flex items-center gap-1.5 mb-1">
          {isWA ? (
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          ) : isNote ? (
            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Mail className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className="text-[10px] text-muted-foreground">
            {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : ""}
          </span>
          <button onClick={onToggleStar} className="ml-1 hover:scale-110 transition-transform">
            {message.isStarred ? (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            ) : (
              <Star className="h-3 w-3 text-muted-foreground/30 hover:text-amber-400" />
            )}
          </button>
        </div>
        {message.subject && (
          <p className="text-xs font-medium text-muted-foreground mb-1">{message.subject}</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <div className="flex items-center gap-1.5 mt-1.5 justify-end">
          {getStatusIcon(message.status)}
          <span className="text-[10px] text-muted-foreground/60 capitalize">{message.status}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Shared Badges ──────────────────────────────────────────────────
function ChannelBadge({ type }: { type: string }) {
  if (type === "email") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] h-5"><Mail className="h-2.5 w-2.5 mr-0.5" />Email</Badge>
  if (type === "whatsapp") return <Badge className="bg-[#25D366]/15 text-[#25D366] border-0 text-[10px] h-5"><MessageCircle className="h-2.5 w-2.5 mr-0.5" />WhatsApp</Badge>
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[10px] h-5"><Hash className="h-2.5 w-2.5 mr-0.5" />Mixed</Badge>
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active": return <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] h-5">Active</Badge>
    case "archived": return <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-0 text-[10px] h-5">Archived</Badge>
    case "closed": return <Badge className="bg-red-500/15 text-red-600 border-0 text-[10px] h-5">Closed</Badge>
    default: return <Badge variant="outline" className="text-[10px] h-5">{status}</Badge>
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2: COMPOSE
// ═══════════════════════════════════════════════════════════════════════
function ComposeTab({ templates, contacts, currentUser }: {
  templates: CommunicationTemplate[]; contacts: CommunicationContact[]; currentUser: { id: string; name: string; email: string } | null
}) {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [toSearch, setToSearch] = useState("")
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [sent, setSent] = useState(false)

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const detectedVars = useMemo(() => {
    if (!selectedTemplate) return []
    const allText = (selectedTemplate.subject || "") + " " + selectedTemplate.body
    return detectVariables(allText)
  }, [selectedTemplate])

  useEffect(() => {
    if (selectedTemplate) {
      const subbedSubject = substituteVariables(selectedTemplate.subject || "", variableValues)
      const subbedBody = substituteVariables(selectedTemplate.body, variableValues)
      setSubject(subbedSubject)
      setBody(subbedBody)
    }
  }, [selectedTemplate, variableValues])

  const filteredContacts = useMemo(() => {
    if (!toSearch) return contacts.slice(0, 10)
    const s = toSearch.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.email?.toLowerCase().includes(s)) ||
      (c.phone?.toLowerCase().includes(s)) ||
      (c.company?.toLowerCase().includes(s))
    ).slice(0, 10)
  }, [contacts, toSearch])

  function selectContact(contact: CommunicationContact) {
    if (channel === "email" && contact.email) {
      setTo(contact.email)
    } else if (channel === "whatsapp" && contact.whatsappNumber) {
      setTo(contact.whatsappNumber)
    } else if (channel === "whatsapp" && contact.phone) {
      setTo(contact.phone)
    } else if (contact.email) {
      setTo(contact.email)
    }
    setShowToDropdown(false)
    setToSearch("")
  }

  async function handleSend() {
    if (!to.trim() || !body.trim()) return
    if (channel === "email" && !subject.trim()) return
    setSending(true)
    try {
      const endpoint = channel === "email" ? "/api/communications/email/send" : "/api/communications/whatsapp/send"
      const payload: Record<string, unknown> = {
        to: to.trim(),
        body,
        senderId: currentUser?.id || "user-admin",
        senderName: currentUser?.name || "Sarah Chen",
        templateId: selectedTemplateId || undefined,
      }
      if (channel === "email") {
        payload.subject = subject
        payload.senderEmail = currentUser?.email || "sarah@creativeflowdigital.com"
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 3000)
        setTo("")
        setSubject("")
        setBody("")
        setSelectedTemplateId("")
        setVariableValues({})
        await refreshConversations()
      }
    } catch (e) {
      console.error("Compose send error:", e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenSquare className="h-5 w-5 text-emerald-500" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel Selector */}
          <div className="flex gap-2">
            <Button
              variant={channel === "email" ? "default" : "outline"}
              className={channel === "email" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
              onClick={() => setChannel("email")}
            >
              <Mail className="h-4 w-4 mr-2" />Email
            </Button>
            <Button
              variant={channel === "whatsapp" ? "default" : "outline"}
              className={channel === "whatsapp" ? "bg-[#25D366] hover:bg-[#20bd5a] text-white" : ""}
              onClick={() => setChannel("whatsapp")}
            >
              <MessageCircle className="h-4 w-4 mr-2" />WhatsApp
            </Button>
          </div>

          {/* From */}
          <div className="flex items-center gap-2">
            <Label className="text-sm w-12 text-right">From</Label>
            <Input value={currentUser?.name || "Sarah Chen"} disabled className="h-9 text-sm bg-muted/30" />
          </div>

          {/* To */}
          <div className="flex items-start gap-2 relative">
            <Label className="text-sm w-12 text-right mt-2">To</Label>
            <div className="flex-1">
              <Input
                placeholder={channel === "email" ? "Email address" : "Phone / WhatsApp number"}
                value={to}
                onChange={e => { setTo(e.target.value); setToSearch(e.target.value); setShowToDropdown(true) }}
                onFocus={() => setShowToDropdown(true)}
                className="h-9 text-sm"
              />
              {showToDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-50 mt-1 w-[calc(100%-56px)] right-0 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredContacts.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-sm"
                      onClick={() => selectContact(c)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                          {getInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {channel === "email" ? c.email : c.whatsappNumber || c.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showToDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowToDropdown(false)} />
              )}
            </div>
          </div>

          {/* Subject (email only) */}
          {channel === "email" && (
            <div className="flex items-center gap-2">
              <Label className="text-sm w-12 text-right">Subject</Label>
              <Input
                placeholder="Email subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Template Selector */}
          <div className="flex items-start gap-2">
            <Label className="text-sm w-12 text-right mt-2">Template</Label>
            <div className="flex-1">
              <Select value={selectedTemplateId} onValueChange={v => { setSelectedTemplateId(v); setVariableValues({}) }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.filter(t => t.type === channel || t.type === "both").map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.category && `(${t.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variable Inputs */}
          {detectedVars.length > 0 && (
            <div className="ml-14 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-500" />Template Variables
              </p>
              {detectedVars.map(v => (
                <div key={v} className="flex items-center gap-2">
                  <Label className="text-xs min-w-[100px] text-emerald-600">{`{{${v}}}`}</Label>
                  <Input
                    placeholder={`Enter ${v}...`}
                    value={variableValues[v] || ""}
                    onChange={e => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="flex items-start gap-2">
            <Label className="text-sm w-12 text-right mt-2">Body</Label>
            <div className="flex-1 relative">
              <Textarea
                placeholder={channel === "email" ? "Write your email..." : "Type your WhatsApp message..."}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="min-h-[200px] text-sm resize-none"
              />
              {channel === "whatsapp" && (
                <span className={`absolute bottom-2 right-2 text-[10px] ${body.length > 3800 ? "text-red-500" : "text-muted-foreground"}`}>
                  {body.length}/4096
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp Preview */}
          {channel === "whatsapp" && body && (
            <div className="ml-14">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Eye className="h-3 w-3" />WhatsApp Preview
              </p>
              <div className="bg-[#ECE5DD] dark:bg-[#1a1a2e] p-3 rounded-lg max-w-xs">
                <div className="bg-[#DCF8C6] dark:bg-emerald-900/40 p-2.5 rounded-lg text-sm whitespace-pre-wrap">
                  {body}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {format(new Date(), "h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex items-center justify-between pt-2">
            {sent && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-emerald-500 flex items-center gap-1">
                <CheckCheck className="h-4 w-4" />Message sent successfully!
              </motion.p>
            )}
            <Button
              onClick={handleSend}
              disabled={!to.trim() || !body.trim() || (channel === "email" && !subject.trim()) || sending}
              className={`ml-auto ${channel === "whatsapp" ? "bg-[#25D366] hover:bg-[#20bd5a]" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send {channel === "email" ? "Email" : "WhatsApp"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3: TEMPLATES
// ═══════════════════════════════════════════════════════════════════════
function TemplatesTab({ templates }: { templates: CommunicationTemplate[] }) {
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null)

  const categories = useMemo(() => {
    const cats = new Set<string>()
    templates.forEach(t => { if (t.category) cats.add(t.category) })
    return Array.from(cats)
  }, [templates])

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false
      return true
    })
  }, [templates, typeFilter, categoryFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(["all", "email", "whatsapp"] as const).map(t => (
              <Button key={t} variant={typeFilter === t ? "default" : "ghost"} size="sm"
                className={`h-7 text-xs ${typeFilter === t ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All" : t === "email" ? <><Mail className="h-3 w-3 mr-1" />Email</> : <><MessageCircle className="h-3 w-3 mr-1" />WhatsApp</>}
              </Button>
            ))}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] h-7 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="h-4 w-4 mr-1" />Create Template
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <TemplateCard key={tpl.id} template={tpl} onPreview={() => setPreviewTemplate(tpl)} />
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{previewTemplate.name}</h3>
                <ChannelBadge type={previewTemplate.type} />
                {previewTemplate.category && (
                  <Badge variant="outline" className="text-xs">{previewTemplate.category}</Badge>
                )}
                {previewTemplate.isDefault && <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Default</Badge>}
              </div>
              {previewTemplate.subject && (
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <VariableHighlight text={previewTemplate.subject} />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <VariableHighlight text={previewTemplate.body} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Active: {previewTemplate.isActive ? "✓" : "✗"}</span>
                <span>Created: {formatDistanceToNow(new Date(previewTemplate.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Template Card ──────────────────────────────────────────────────
function TemplateCard({ template, onPreview }: { template: CommunicationTemplate; onPreview: () => void }) {
  const variables = detectVariables((template.subject || "") + " " + template.body)
  const usageCount = (template as Record<string, unknown>)._count
    ? ((template as Record<string, unknown>)._count as Record<string, number>)?.messages || 0
    : 0

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" onClick={onPreview}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm">{template.name}</h4>
            <div className="flex items-center gap-1">
              {template.isDefault && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
              {template.isActive ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <ChannelBadge type={template.type} />
            {template.category && (
              <Badge variant="outline" className="text-[10px] h-5">{template.category}</Badge>
            )}
          </div>
          {template.subject && (
            <p className="text-xs text-muted-foreground mb-1 truncate">
              <span className="font-medium">Subj:</span> {template.subject}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 line-clamp-3 mb-2">{template.body.substring(0, 150)}</p>
          {variables.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {variables.map(v => (
                <Badge key={v} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] h-4 px-1.5">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{usageCount} uses</span>
            <span>{formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Variable Highlight ─────────────────────────────────────────────
function VariableHighlight({ text }: { text: string }) {
  const parts = text.split(/(\{\{\w+\}\})/g)
  return (
    <div className="mt-1 p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap border">
      {parts.map((part, i) => {
        if (/^\{\{\w+\}\}$/.test(part)) {
          return <span key={i} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-1 rounded">{part}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

// ─── Create Template Dialog ─────────────────────────────────────────
function CreateTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("")
  const [type, setType] = useState("email")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !body.trim()) return
    setCreating(true)
    try {
      const vars = detectVariables((subject || "") + " " + body)
      await fetch("/api/communications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, type, subject: subject || null, body,
          category: category || null,
          variables: vars.length > 0 ? JSON.stringify(vars) : null,
          isActive,
        }),
      })
      setName(""); setType("email"); setSubject(""); setBody(""); setCategory(""); setIsActive(true)
      onOpenChange(false)
      await refreshTemplates()
    } catch (e) {
      console.error("Create template error:", e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />Create Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {type === "email" && (
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject with {{variables}}" className="h-9 text-sm" />
            </div>
          )}
          <div>
            <Label className="text-xs">Body * <span className="text-muted-foreground/60">(use {"{{variable}}"} for placeholders)</span></Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Template body with {{name}}, {{company}}, etc." className="min-h-[120px] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} disabled={!name.trim() || !body.trim() || creating} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4: CONTACTS
// ═══════════════════════════════════════════════════════════════════════
function ContactsTab({ contacts }: { contacts: CommunicationContact[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [channelFilter, setChannelFilter] = useState("all")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [detailContact, setDetailContact] = useState<CommunicationContact | null>(null)

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (roleFilter !== "all" && c.role !== roleFilter) return false
      if (channelFilter !== "all" && c.preferredChannel !== channelFilter) return false
      if (favoritesOnly && !c.isFavorite) return false
      if (search) {
        const s = search.toLowerCase()
        return c.name.toLowerCase().includes(s) ||
          (c.email?.toLowerCase().includes(s)) ||
          (c.phone?.toLowerCase().includes(s)) ||
          (c.company?.toLowerCase().includes(s))
      }
      return true
    })
  }, [contacts, search, roleFilter, channelFilter, favoritesOnly])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm w-[200px]" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            className={`h-9 ${favoritesOnly ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Heart className={`h-4 w-4 mr-1 ${favoritesOnly ? "fill-white" : ""}`} />Favorites
          </Button>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="h-4 w-4 mr-1" />Add Contact
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No contacts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(contact => (
            <ContactCard key={contact.id} contact={contact} onDetail={() => setDetailContact(contact)} />
          ))}
        </div>
      )}

      {/* Add Contact Dialog */}
      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Detail Dialog */}
      <Dialog open={!!detailContact} onOpenChange={() => setDetailContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {detailContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={`bg-gradient-to-br ${getRoleGradient(detailContact.role)} text-white text-lg`}>
                    {getInitials(detailContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{detailContact.name}</h3>
                  {detailContact.company && <p className="text-sm text-muted-foreground">{detailContact.company}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    {detailContact.role && <RoleBadge role={detailContact.role} />}
                    <ChannelBadge type={detailContact.preferredChannel} />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3">
                {detailContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    <a href={`mailto:${detailContact.email}`} className="text-emerald-600 hover:underline">{detailContact.email}</a>
                  </div>
                )}
                {detailContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <a href={`tel:${detailContact.phone}`} className="hover:underline">{detailContact.phone}</a>
                  </div>
                )}
                {detailContact.whatsappNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    <span>{detailContact.whatsappNumber}</span>
                  </div>
                )}
                {detailContact.lastContactedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last contacted {formatDistanceToNow(new Date(detailContact.lastContactedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
              {detailContact.notes && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{detailContact.notes}</div>
              )}
              {parseJsonSafe(detailContact.tags).length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {parseJsonSafe(detailContact.tags).map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Contact Card ───────────────────────────────────────────────────
function ContactCard({ contact, onDetail }: { contact: CommunicationContact; onDetail: () => void }) {
  const tags = parseJsonSafe(contact.tags)

  async function toggleFavorite() {
    try {
      await fetch(`/api/communications/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !contact.isFavorite }),
      })
      await refreshContacts()
    } catch (e) { console.error("Toggle favorite error:", e) }
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className={`bg-gradient-to-br ${getRoleGradient(contact.role)} text-white`}>
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{contact.name}</h4>
              {contact.company && <p className="text-xs text-muted-foreground truncate">{contact.company}</p>}
              <div className="flex items-center gap-1 mt-1">
                {contact.role && <RoleBadge role={contact.role} />}
              </div>
            </div>
            <button onClick={toggleFavorite} className="flex-shrink-0 hover:scale-110 transition-transform">
              {contact.isFavorite ? (
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              ) : (
                <Heart className="h-4 w-4 text-muted-foreground/30 hover:text-rose-400" />
              )}
            </button>
          </div>

          <div className="space-y-1.5 mb-3">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
                <Mail className="h-3 w-3 flex-shrink-0" />{contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline truncate" onClick={e => e.stopPropagation()}>
                <Phone className="h-3 w-3 flex-shrink-0" />{contact.phone}
              </a>
            )}
            {contact.whatsappNumber && (
              <div className="flex items-center gap-1.5 text-xs text-[#25D366] truncate">
                <MessageCircle className="h-3 w-3 flex-shrink-0" />{contact.whatsappNumber}
              </div>
            )}
          </div>

          {contact.lastContactedAt && (
            <p className="text-[10px] text-muted-foreground/60 mb-2">
              Last contacted {formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true })}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-3">
              {tags.slice(0, 3).map(t => (
                <Badge key={t} variant="secondary" className="h-4 text-[9px] px-1.5">{t}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-2 border-t">
            {contact.email && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-emerald-600" asChild>
                <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()}>
                  <Mail className="h-3 w-3 mr-1" />Email
                </a>
              </Button>
            )}
            {contact.whatsappNumber && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-[#25D366]">
                <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 ml-auto" onClick={onDetail}>
              <Eye className="h-3 w-3 mr-1" />View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "client": return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] h-4 px-1.5">Client</Badge>
    case "influencer": return <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-0 text-[10px] h-4 px-1.5">Influencer</Badge>
    case "partner": return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[10px] h-4 px-1.5">Partner</Badge>
    case "vendor": return <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 border-0 text-[10px] h-4 px-1.5">Vendor</Badge>
    default: return <Badge variant="outline" className="text-[10px] h-4 px-1.5">{role}</Badge>
  }
}

// ─── Add Contact Dialog ─────────────────────────────────────────────
function AddContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [preferredChannel, setPreferredChannel] = useState("email")
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      await fetch("/api/communications/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email: email || null, phone: phone || null,
          whatsappNumber: whatsappNumber || null, company: company || null,
          role: role || null, preferredChannel,
        }),
      })
      setName(""); setEmail(""); setPhone(""); setWhatsappNumber(""); setCompany(""); setRole(""); setPreferredChannel("email")
      onOpenChange(false)
      await refreshContacts()
    } catch (e) {
      console.error("Create contact error:", e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />Add Contact
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contact name" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">WhatsApp Number</Label>
              <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="WhatsApp" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Company</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Preferred Channel</Label>
              <Select value={preferredChannel} onValueChange={setPreferredChannel}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} disabled={!name.trim() || creating} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 5: ANALYTICS
// ═══════════════════════════════════════════════════════════════════════
function AnalyticsTab({ conversations, templates, contacts }: {
  conversations: Conversation[]; templates: CommunicationTemplate[]; contacts: CommunicationContact[]
}) {
  // Gather all messages from conversations
  const allMessages = useMemo(() => {
    const msgs: CommunicationMessage[] = []
    conversations.forEach(c => {
      if (c.messages) msgs.push(...c.messages)
    })
    return msgs
  }, [conversations])

  // KPIs
  const totalSent = useMemo(() => allMessages.filter(m => m.direction === "outbound").length, [allMessages])
  const emailSent = useMemo(() => allMessages.filter(m => m.direction === "outbound" && m.type === "email").length, [allMessages])
  const emailOpened = useMemo(() => allMessages.filter(m => m.direction === "outbound" && m.type === "email" && (m.status === "read" || m.openedAt)).length, [allMessages])
  const emailOpenRate = emailSent > 0 ? Math.round((emailOpened / emailSent) * 100) : 0
  const repliedCount = useMemo(() => allMessages.filter(m => m.direction === "outbound" && m.repliedAt).length, [allMessages])
  const replyRate = totalSent > 0 ? Math.round((repliedCount / totalSent) * 100) : 0

  // Channel breakdown
  const emailCount = allMessages.filter(m => m.type === "email").length
  const waCount = allMessages.filter(m => m.type === "whatsapp").length
  const noteCount = allMessages.filter(m => m.type === "note").length
  const channelTotal = emailCount + waCount + noteCount || 1

  // 7-day volume
  const sevenDayData = useMemo(() => {
    const days: { date: string; count: number; emailCount: number; waCount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = format(d, "yyyy-MM-dd")
      const dayMsgs = allMessages.filter(m => {
        try { return format(new Date(m.createdAt), "yyyy-MM-dd") === dateStr } catch { return false }
      })
      days.push({
        date: format(d, "EEE"),
        count: dayMsgs.length,
        emailCount: dayMsgs.filter(m => m.type === "email").length,
        waCount: dayMsgs.filter(m => m.type === "whatsapp").length,
      })
    }
    return days
  }, [allMessages])

  const maxDayCount = Math.max(...sevenDayData.map(d => d.count), 1)

  // Top contacts by message count
  const topContacts = useMemo(() => {
    const contactCounts: Record<string, { name: string; count: number }> = {}
    allMessages.forEach(m => {
      const name = m.direction === "outbound" ? m.recipientName : m.senderName
      if (!contactCounts[name]) contactCounts[name] = { name, count: 0 }
      contactCounts[name].count++
    })
    return Object.values(contactCounts).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [allMessages])

  // Template usage
  const templateUsage = useMemo(() => {
    return templates.map(t => {
      const count = (t as Record<string, unknown>)._count
        ? ((t as Record<string, unknown>)._count as Record<string, number>)?.messages || 0
        : 0
      return { name: t.name, type: t.type, count }
    }).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [templates])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Send className="h-5 w-5" />} label="Total Messages Sent" value={totalSent} color="emerald" />
        <KPICard icon={<MailCheck className="h-5 w-5" />} label="Email Open Rate" value={`${emailOpenRate}%`} color="emerald" />
        <KPICard icon={<MessageSquare className="h-5 w-5" />} label="Reply Rate" value={`${replyRate}%`} color="teal" />
        <KPICard icon={<Timer className="h-5 w-5" />} label="Avg Response Time" value="2.4h" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Channel Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />Channel Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-emerald-500" />Email</span>
                <span className="text-sm font-medium">{emailCount} <span className="text-muted-foreground text-xs">({Math.round(emailCount / channelTotal * 100)}%)</span></span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(emailCount / channelTotal) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />WhatsApp</span>
                <span className="text-sm font-medium">{waCount} <span className="text-muted-foreground text-xs">({Math.round(waCount / channelTotal * 100)}%)</span></span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(waCount / channelTotal) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-[#25D366]" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5 text-amber-500" />Internal Notes</span>
                <span className="text-sm font-medium">{noteCount} <span className="text-muted-foreground text-xs">({Math.round(noteCount / channelTotal * 100)}%)</span></span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(noteCount / channelTotal) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Volume Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />7-Day Message Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {sevenDayData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5" style={{ height: "120px" }}>
                    <div className="flex-1 flex flex-col justify-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.emailCount / maxDayCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="bg-emerald-400 rounded-t min-h-[2px]"
                        style={{ maxHeight: "50%" }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.waCount / maxDayCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                        className="bg-[#25D366] rounded-b min-h-[2px]"
                        style={{ maxHeight: "50%" }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.date}</span>
                  <span className="text-[10px] font-medium">{day.count}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" />Email
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[#25D366]" />WhatsApp
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />Top Contacts by Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topContacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-medium text-emerald-600">{c.count}</span>
                    <span className="text-[10px] text-muted-foreground">msgs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" />Template Usage Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templateUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No template usage data yet</p>
            ) : (
              <div className="space-y-3">
                {templateUsage.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {t.type === "email" ? <Mail className="h-4 w-4 text-emerald-500" /> : <MessageCircle className="h-4 w-4 text-[#25D366]" />}
                    </div>
                    <span className="text-sm flex-1 truncate">{t.name}</span>
                    <span className="text-sm font-medium text-emerald-600">{t.count}</span>
                    <span className="text-[10px] text-muted-foreground">uses</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── KPI Card ───────────────────────────────────────────────────────
function KPICard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string
}) {
  const colorClasses: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-600",
    teal: "from-teal-500 to-emerald-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-pink-600",
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.emerald} flex items-center justify-center text-white flex-shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
