"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  Paperclip,
  Star,
  StarOff,
  Archive,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  Phone,
  MailOpen,
  Plus,
  Filter,
  Tag,
  Sparkles,
  StickyNote,
  Reply,
  ExternalLink,
  RefreshCw,
  User,
  Building2,
  Heart,
  Link2,
  ImageIcon,
  File,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

// ── Constants ──────────────────────────────────────────────────────────
const WA_GREEN = "#25D366"

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40" },
  high: { label: "High", color: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-100 dark:bg-orange-900/40" },
  normal: { label: "Normal", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-100 dark:bg-emerald-900/40" },
  low: { label: "Low", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800" },
}

const STATUS_BADGE: Record<string, { label: string; color: string; bgColor: string }> = {
  sent: { label: "Sent", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-100 dark:bg-emerald-900/40" },
  delivered: { label: "Delivered", color: "text-teal-700 dark:text-teal-300", bgColor: "bg-teal-100 dark:bg-teal-900/40" },
  read: { label: "Read", color: "text-cyan-700 dark:text-cyan-300", bgColor: "bg-cyan-100 dark:bg-cyan-900/40" },
  failed: { label: "Failed", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40" },
  bounced: { label: "Bounced", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40" },
  queued: { label: "Queued", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-100 dark:bg-amber-900/40" },
  draft: { label: "Draft", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800" },
}

// ── Helper ─────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function parseJsonArray(val: string | null): string[] {
  if (!val) return []
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))]
}

// ── Component ──────────────────────────────────────────────────────────
export function InboxView() {
  const {
    conversations,
    communicationTemplates,
    communicationContacts,
    clients,
    influencers,
    campaigns,
    teams,
    currentUser,
    setConversations,
    setCommunicationTemplates,
    setCommunicationContacts,
  } = useERPStore()

  const [activeTab, setActiveTab] = useState("inbox")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [composeChannel, setComposeChannel] = useState<"email" | "whatsapp">("email")
  const [sendingMessage, setSendingMessage] = useState(false)

  // Compose form state
  const [composeTo, setComposeTo] = useState("")
  const [composeToEmail, setComposeToEmail] = useState("")
  const [composeToPhone, setComposeToPhone] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [composeTemplateId, setComposeTemplateId] = useState("")

  // Reply state in inbox
  const [replyChannel, setReplyChannel] = useState<"email" | "whatsapp" | "note">("email")
  const [replyBody, setReplyBody] = useState("")
  const [replyTemplateId, setReplyTemplateId] = useState("")

  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateType, setTemplateType] = useState("email")
  const [templateCategory, setTemplateCategory] = useState("")
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [templateTypeFilter, setTemplateTypeFilter] = useState("all")

  // Contact editor state
  const [editingContact, setEditingContact] = useState<CommunicationContact | null>(null)
  const [contactSearch, setContactSearch] = useState("")
  const [contactRoleFilter, setContactRoleFilter] = useState("all")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactWhatsapp, setContactWhatsapp] = useState("")
  const [contactCompany, setContactCompany] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [contactPreferredChannel, setContactPreferredChannel] = useState("email")
  const [contactNotes, setContactNotes] = useState("")

  // Compose recipient search
  const [recipientSearch, setRecipientSearch] = useState("")
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)

  // Fetch data from APIs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, templRes, contRes] = await Promise.all([
          fetch("/api/communications/conversations"),
          fetch("/api/communications/templates"),
          fetch("/api/communications/contacts"),
        ])
        const convJson = await convRes.json()
        const templJson = await templRes.json()
        const contJson = await contRes.json()

        if (convJson?.conversations) setConversations(convJson.conversations)
        else if (Array.isArray(convJson)) setConversations(convJson)

        if (templJson?.templates) setCommunicationTemplates(templJson.templates)
        else if (Array.isArray(templJson)) setCommunicationTemplates(templJson)

        if (contJson?.contacts) setCommunicationContacts(contJson.contacts)
        else if (Array.isArray(contJson)) setCommunicationContacts(contJson)
      } catch (err) {
        console.error("Failed to load communication data:", err)
      }
    }
    fetchData()
  }, [setConversations, setCommunicationTemplates, setCommunicationContacts])

  // ── Computed ──────────────────────────────────────────────────────────
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  )

  const filteredConversations = useMemo(() => {
    let result = [...conversations]
    if (channelFilter !== "all") {
      result = result.filter((c) => c.channel === channelFilter || c.type === channelFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q)) ||
          (c.client && c.client.name.toLowerCase().includes(q)) ||
          (c.influencer && c.influencer.name.toLowerCase().includes(q)) ||
          (c.assignedTo && c.assignedTo.name.toLowerCase().includes(q))
      )
    }
    result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    return result
  }, [conversations, channelFilter, statusFilter, searchQuery])

  const filteredTemplates = useMemo(() => {
    let result = [...communicationTemplates]
    if (templateTypeFilter !== "all") {
      result = result.filter((t) => t.type === templateTypeFilter)
    }
    return result
  }, [communicationTemplates, templateTypeFilter])

  const filteredContacts = useMemo(() => {
    let result = [...communicationContacts]
    if (showFavoritesOnly) {
      result = result.filter((c) => c.isFavorite)
    }
    if (contactRoleFilter !== "all") {
      result = result.filter((c) => c.role?.toLowerCase() === contactRoleFilter.toLowerCase())
    }
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q))
      )
    }
    return result
  }, [communicationContacts, contactSearch, contactRoleFilter, showFavoritesOnly])

  const totalUnread = useMemo(() => conversations.reduce((acc, c) => acc + c.unreadCount, 0), [conversations])

  // Build recipient options from contacts + clients + influencers + employees
  const recipientOptions = useMemo(() => {
    const options: { id: string; name: string; email: string | null; phone: string | null; type: string }[] = []
    communicationContacts.forEach((c) => {
      options.push({ id: c.id, name: c.name, email: c.email, phone: c.phone || c.whatsappNumber, type: "contact" })
    })
    clients.forEach((c) => {
      options.push({ id: c.id, name: c.name, email: null, phone: null, type: "client" })
    })
    influencers.forEach((i) => {
      options.push({ id: i.id, name: i.name, email: i.email, phone: i.phone, type: "influencer" })
    })
    teams.forEach((t) => {
      t.members.forEach((m) => {
        options.push({ id: m.user.id, name: m.user.name, email: m.user.email, phone: null, type: "employee" })
      })
    })
    return options
  }, [communicationContacts, clients, influencers, teams])

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return recipientOptions.slice(0, 10)
    const q = recipientSearch.toLowerCase()
    return recipientOptions.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.email && r.email.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [recipientOptions, recipientSearch])

  // ── Analytics computed ────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const allMessages = conversations.flatMap((c) => c.messages)
    const outbound = allMessages.filter((m) => m.direction === "outbound")
    const readMsgs = allMessages.filter((m) => m.readAt)
    const repliedMsgs = allMessages.filter((m) => m.repliedAt)
    const emailMsgs = allMessages.filter((m) => m.type === "email")
    const waMsgs = allMessages.filter((m) => m.type === "whatsapp")

    const openRate = outbound.length > 0 ? Math.round((readMsgs.length / outbound.length) * 100) : 0
    const replyRate = outbound.length > 0 ? Math.round((repliedMsgs.length / outbound.length) * 100) : 0

    // Avg response time
    const responseTimes: number[] = []
    conversations.forEach((conv) => {
      const msgs = conv.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      for (let i = 1; i < msgs.length; i++) {
        if (msgs[i].direction === "outbound" && msgs[i - 1].direction === "inbound") {
          const diff = new Date(msgs[i].createdAt).getTime() - new Date(msgs[i - 1].createdAt).getTime()
          responseTimes.push(diff / (1000 * 60))
        }
      }
    })
    const avgResponseMin = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0

    // Daily volumes (last 7 days)
    const dailyVolumes: { date: string; email: number; whatsapp: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = format(d, "yyyy-MM-dd")
      const label = format(d, "EEE")
      const dayEmail = emailMsgs.filter((m) => format(new Date(m.createdAt), "yyyy-MM-dd") === key).length
      const dayWa = waMsgs.filter((m) => format(new Date(m.createdAt), "yyyy-MM-dd") === key).length
      dailyVolumes.push({ date: label, email: dayEmail, whatsapp: dayWa })
    }

    // Top contacts by message count
    const contactCounts: Record<string, { name: string; count: number }> = {}
    allMessages.forEach((m) => {
      if (m.direction === "inbound") {
        if (!contactCounts[m.senderName]) contactCounts[m.senderName] = { name: m.senderName, count: 0 }
        contactCounts[m.senderName].count++
      }
    })
    const topContacts = Object.values(contactCounts).sort((a, b) => b.count - a.count).slice(0, 5)

    // Template usage
    const templateUsage: Record<string, { name: string; count: number }> = {}
    allMessages.forEach((m) => {
      if (m.templateId) {
        const templ = communicationTemplates.find((t) => t.id === m.templateId)
        const name = templ?.name || "Unknown"
        if (!templateUsage[m.templateId]) templateUsage[m.templateId] = { name, count: 0 }
        templateUsage[m.templateId].count++
      }
    })
    const topTemplates = Object.values(templateUsage).sort((a, b) => b.count - a.count).slice(0, 5)

    return {
      totalSent: outbound.length,
      openRate,
      replyRate,
      avgResponseMin,
      emailCount: emailMsgs.length,
      whatsappCount: waMsgs.length,
      dailyVolumes,
      topContacts,
      topTemplates,
    }
  }, [conversations, communicationTemplates])

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id)
  }, [])

  const handleSendReply = useCallback(async () => {
    if (!selectedConversation || !replyBody.trim()) return
    setSendingMessage(true)
    try {
      const payload: Record<string, unknown> = {
        body: replyBody,
        type: replyChannel === "note" ? "note" : replyChannel,
      }
      if (replyChannel === "email") {
        payload.subject = `Re: ${selectedConversation.subject || "No Subject"}`
        payload.to = selectedConversation.messages.find((m) => m.direction === "inbound")?.senderEmail || ""
      } else if (replyChannel === "whatsapp") {
        payload.to = selectedConversation.messages.find((m) => m.direction === "inbound")?.senderPhone || ""
      }
      const endpoint =
        replyChannel === "email"
          ? `/api/communications/email/send`
          : replyChannel === "whatsapp"
          ? `/api/communications/whatsapp/send`
          : `/api/communications/conversations/${selectedConversation.id}/messages`

      if (replyChannel !== "note") {
        payload.conversationId = selectedConversation.id
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        // Refresh conversation detail
        const detailRes = await fetch(`/api/communications/conversations/${selectedConversation.id}`)
        if (detailRes.ok) {
          const detailJson = await detailRes.json()
          const updated = detailJson.conversation || detailJson
          setConversations(conversations.map((c) => (c.id === updated.id ? updated : c)))
        }
        setReplyBody("")
        setReplyTemplateId("")
      }
    } catch (err) {
      console.error("Failed to send reply:", err)
    } finally {
      setSendingMessage(false)
    }
  }, [selectedConversation, replyBody, replyChannel, conversations, setConversations])

  const handleSendCompose = useCallback(async () => {
    if (!composeBody.trim()) return
    setSendingMessage(true)
    try {
      if (composeChannel === "email") {
        const res = await fetch("/api/communications/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: composeToEmail,
            subject: composeSubject,
            body: composeBody,
          }),
        })
        if (res.ok) {
          // Refresh conversations
          const convRes = await fetch("/api/communications/conversations")
          if (convRes.ok) {
            const json = await convRes.json()
            setConversations(json.conversations || json)
          }
          setComposeTo("")
          setComposeToEmail("")
          setComposeToPhone("")
          setComposeSubject("")
          setComposeBody("")
          setComposeTemplateId("")
          setActiveTab("inbox")
        }
      } else {
        const res = await fetch("/api/communications/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: composeToPhone,
            body: composeBody,
          }),
        })
        if (res.ok) {
          const convRes = await fetch("/api/communications/conversations")
          if (convRes.ok) {
            const json = await convRes.json()
            setConversations(json.conversations || json)
          }
          setComposeTo("")
          setComposeToEmail("")
          setComposeToPhone("")
          setComposeSubject("")
          setComposeBody("")
          setComposeTemplateId("")
          setActiveTab("inbox")
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSendingMessage(false)
    }
  }, [composeChannel, composeBody, composeToEmail, composeToPhone, composeSubject, setConversations])

  const handleApplyTemplate = useCallback(
    (templateId: string, isCompose: boolean) => {
      const template = communicationTemplates.find((t) => t.id === templateId)
      if (!template) return
      if (isCompose) {
        setComposeSubject(template.subject || composeSubject)
        setComposeBody(template.body)
        setComposeTemplateId(templateId)
        if (template.type === "whatsapp") setComposeChannel("whatsapp")
        else if (template.type === "email") setComposeChannel("email")
      } else {
        setReplyBody(template.body)
        setReplyTemplateId(templateId)
        if (template.type === "whatsapp") setReplyChannel("whatsapp")
        else if (template.type === "email") setReplyChannel("email")
      }
    },
    [communicationTemplates, composeSubject]
  )

  const handleSaveTemplate = useCallback(async () => {
    try {
      const payload = {
        name: templateName,
        type: templateType,
        category: templateCategory || null,
        subject: templateType === "email" ? templateSubject : null,
        body: templateBody,
        variables: JSON.stringify(extractVariables(templateBody)),
        isDefault: false,
        isActive: true,
      }
      if (editingTemplate) {
        // For now, just add new - full PUT can be added later
        await fetch("/api/communications/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/communications/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      const res = await fetch("/api/communications/templates")
      if (res.ok) {
        const json = await res.json()
        setCommunicationTemplates(json.templates || json)
      }
      setEditingTemplate(null)
      setTemplateName("")
      setTemplateType("email")
      setTemplateCategory("")
      setTemplateSubject("")
      setTemplateBody("")
    } catch (err) {
      console.error("Failed to save template:", err)
    }
  }, [editingTemplate, templateName, templateType, templateCategory, templateSubject, templateBody, setCommunicationTemplates])

  const handleSaveContact = useCallback(async () => {
    try {
      const payload = {
        name: contactName,
        email: contactEmail || null,
        phone: contactPhone || null,
        whatsappNumber: contactWhatsapp || null,
        company: contactCompany || null,
        role: contactRole || null,
        preferredChannel: contactPreferredChannel,
        notes: contactNotes || null,
        isFavorite: false,
      }
      await fetch("/api/communications/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const res = await fetch("/api/communications/contacts")
      if (res.ok) {
        const json = await res.json()
        setCommunicationContacts(json.contacts || json)
      }
      setEditingContact(null)
      setContactName("")
      setContactEmail("")
      setContactPhone("")
      setContactWhatsapp("")
      setContactCompany("")
      setContactRole("")
      setContactPreferredChannel("email")
      setContactNotes("")
    } catch (err) {
      console.error("Failed to save contact:", err)
    }
  }, [contactName, contactEmail, contactPhone, contactWhatsapp, contactCompany, contactRole, contactPreferredChannel, contactNotes, setCommunicationContacts])

  const handleUpdateConversationStatus = useCallback(
    async (convId: string, status: string) => {
      try {
        await fetch(`/api/communications/conversations/${convId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
        setConversations(conversations.map((c) => (c.id === convId ? { ...c, status } : c)))
      } catch (err) {
        console.error("Failed to update conversation:", err)
      }
    },
    [conversations, setConversations]
  )

  const handleSelectRecipient = useCallback(
    (r: { name: string; email: string | null; phone: string | null; type: string }) => {
      setComposeTo(r.name)
      setComposeToEmail(r.email || "")
      setComposeToPhone(r.phone || "")
      setShowRecipientDropdown(false)
      setRecipientSearch("")
    },
    []
  )

  const handleToggleFavorite = useCallback(async (contactId: string, currentVal: boolean) => {
    try {
      await fetch(`/api/communications/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, isFavorite: !currentVal }),
      })
    } catch (err) {
      console.error("Failed to update favorite:", err)
    }
  }, [])

  // ── Render helpers ────────────────────────────────────────────────────
  const renderChannelIcon = (type: string, size = 16) => {
    if (type === "whatsapp") {
      return (
        <div className="flex items-center justify-center rounded-full" style={{ backgroundColor: WA_GREEN, width: size + 8, height: size + 8 }}>
          <MessageCircle style={{ width: size, height: size, color: "#fff" }} />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center rounded-full bg-emerald-500" style={{ width: size + 8, height: size + 8 }}>
        <Mail style={{ width: size, height: size, color: "#fff" }} />
      </div>
    )
  }

  const renderMessageStatus = (msg: CommunicationMessage) => {
    if (msg.type === "whatsapp") {
      if (msg.status === "read") return <CheckCheck className="w-4 h-4 text-blue-400" />
      if (msg.status === "delivered") return <CheckCheck className="w-4 h-4 text-slate-400" />
      if (msg.status === "sent") return <Check className="w-4 h-4 text-slate-400" />
      if (msg.status === "failed") return <AlertCircle className="w-4 h-4 text-red-400" />
    }
    if (msg.type === "email") {
      if (msg.status === "read" || msg.openedAt) return <MailOpen className="w-4 h-4 text-emerald-500" />
      if (msg.status === "delivered") return <Check className="w-4 h-4 text-emerald-400" />
      if (msg.status === "failed" || msg.status === "bounced") return <XCircle className="w-4 h-4 text-red-400" />
      if (msg.status === "sent") return <Check className="w-4 h-4 text-slate-400" />
    }
    if (msg.type === "note") return <StickyNote className="w-4 h-4 text-amber-400" />
    return null
  }

  // ── TAB 1: Inbox ─────────────────────────────────────────────────────
  const renderInbox = () => (
    <div className="flex h-[calc(100vh-12rem)] gap-0 bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Left Panel - Conversation List */}
      <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/20">
        {/* Search & Filters */}
        <div className="p-3 space-y-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              {(["all", "email", "whatsapp"] as const).map((ch) => (
                <Button
                  key={ch}
                  size="sm"
                  variant={channelFilter === ch ? "default" : "ghost"}
                  className={cn(
                    "h-7 text-xs px-2.5",
                    channelFilter === ch && ch === "whatsapp" && "bg-[#25D366] hover:bg-[#1eb954] text-white",
                    channelFilter === ch && ch === "email" && "bg-emerald-600 hover:bg-emerald-700 text-white",
                    channelFilter === ch && ch === "all" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => setChannelFilter(ch)}
                >
                  {ch === "all" ? "All" : ch === "email" ? <Mail className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              {(["active", "archived", "closed"] as const).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={statusFilter === st ? "default" : "ghost"}
                  className={cn("h-7 text-xs px-2.5 capitalize", statusFilter === st && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No conversations</p>
              <p className="text-xs mt-1">Start a new conversation from Compose</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => {
                const priority = PRIORITY_CONFIG[conv.priority] || PRIORITY_CONFIG.normal
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 relative",
                      selectedConversationId === conv.id && "bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-l-emerald-500"
                    )}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    {/* Priority strip */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-r", conv.priority === "urgent" ? "bg-red-500" : conv.priority === "high" ? "bg-orange-500" : conv.priority === "low" ? "bg-slate-300" : "bg-emerald-500")} />

                    <div className="flex-shrink-0 mt-0.5">{renderChannelIcon(conv.channel, 14)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-sm font-semibold truncate", conv.unreadCount > 0 && "text-foreground")}>
                          {conv.subject || "No Subject"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessagePreview || "No messages yet"}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        {conv.client && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {conv.client.name}
                          </Badge>
                        )}
                        {conv.influencer && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                            <Star className="w-2.5 h-2.5" />
                            {conv.influencer.name}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {conv.assignedTo && (
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            {getInitials(conv.assignedTo.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Badge className={cn("text-[9px] px-1 py-0 h-4", priority.bgColor, priority.color, "border-0")}>
                        {priority.label}
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Conversation Detail */}
      <div className="hidden md:flex flex-1 flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Inbox className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose from the list to view messages</p>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-muted/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {renderChannelIcon(selectedConversation.channel, 14)}
                    <h3 className="text-lg font-semibold truncate">
                      {selectedConversation.subject || "No Subject"}
                    </h3>
                    <Badge className={cn("text-xs", PRIORITY_CONFIG[selectedConversation.priority]?.bgColor, PRIORITY_CONFIG[selectedConversation.priority]?.color, "border-0")}>
                      {PRIORITY_CONFIG[selectedConversation.priority]?.label || "Normal"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selectedConversation.client && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedConversation.client.name}
                      </span>
                    )}
                    {selectedConversation.influencer && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {selectedConversation.influencer.name} (@{selectedConversation.influencer.username})
                      </span>
                    )}
                    {selectedConversation.assignedTo && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {selectedConversation.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConversation.status}
                    onValueChange={(val) => handleUpdateConversationStatus(selectedConversation.id, val)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
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
              {/* Tags */}
              {selectedConversation.tags && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  {parseJsonArray(selectedConversation.tags).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Message Thread */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No messages in this conversation</p>
                  </div>
                ) : (
                  selectedConversation.messages
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((msg) => {
                      const isOutbound = msg.direction === "outbound"
                      const isNote = msg.type === "note"
                      const statusInfo = STATUS_BADGE[msg.status]

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-3",
                            isOutbound ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {/* Avatar */}
                          <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                            <AvatarFallback className={cn("text-xs", isOutbound ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                              {getInitials(msg.senderName)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Message bubble */}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-xl px-4 py-3",
                              isNote && "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
                              !isNote && isOutbound && msg.type === "whatsapp" && "bg-[#DCF8C6] dark:bg-emerald-900/40",
                              !isNote && isOutbound && msg.type === "email" && "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800",
                              !isNote && !isOutbound && "bg-muted"
                            )}
                          >
                            {/* Note header */}
                            {isNote && (
                              <div className="flex items-center gap-1.5 mb-2 text-amber-700 dark:text-amber-400">
                                <StickyNote className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">Internal Note</span>
                              </div>
                            )}

                            {/* Email subject line */}
                            {msg.type === "email" && msg.subject && (
                              <div className="text-xs font-semibold text-muted-foreground mb-2 pb-2 border-b border-border/50">
                                {msg.subject}
                              </div>
                            )}

                            {/* Sender info */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold">{msg.senderName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            {/* Body */}
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.htmlBody ? (
                                <div dangerouslySetInnerHTML={{ __html: msg.htmlBody }} />
                              ) : (
                                msg.body
                              )}
                            </div>

                            {/* Media attachments */}
                            {msg.mediaUrls && parseJsonArray(msg.mediaUrls).length > 0 && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  {parseJsonArray(msg.mediaUrls).length} attachment(s)
                                </span>
                              </div>
                            )}

                            {/* Status & direction */}
                            <div className="flex items-center gap-2 mt-2">
                              {isOutbound && renderMessageStatus(msg)}
                              {statusInfo && !isNote && (
                                <Badge className={cn("text-[9px] px-1 py-0 h-3.5", statusInfo.bgColor, statusInfo.color, "border-0")}>
                                  {statusInfo.label}
                                </Badge>
                              )}
                              {msg.type === "email" && msg.openedAt && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="text-[9px] px-1 py-0 h-3.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-0">
                                      Opened
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Opened {formatDistanceToNow(new Date(msg.openedAt), { addSuffix: true })}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {msg.failureReason && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="text-[9px] px-1 py-0 h-3.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0">
                                      {msg.failureReason}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{msg.failureReason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                )}
              </div>
            </ScrollArea>

            {/* Compose Area */}
            <div className="border-t p-4 bg-muted/10">
              <div className="max-w-3xl mx-auto">
                {/* Channel toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                    {(["email", "whatsapp", "note"] as const).map((ch) => (
                      <Button
                        key={ch}
                        size="sm"
                        variant={replyChannel === ch ? "default" : "ghost"}
                        className={cn(
                          "h-7 text-xs px-3 gap-1.5",
                          replyChannel === ch && ch === "email" && "bg-emerald-600 hover:bg-emerald-700 text-white",
                          replyChannel === ch && ch === "whatsapp" && "bg-[#25D366] hover:bg-[#1eb954] text-white",
                          replyChannel === ch && ch === "note" && "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                        onClick={() => setReplyChannel(ch)}
                      >
                        {ch === "email" ? <Mail className="w-3.5 h-3.5" /> : ch === "whatsapp" ? <MessageCircle className="w-3.5 h-3.5" /> : <StickyNote className="w-3.5 h-3.5" />}
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {/* Template selector */}
                    <Select value={replyTemplateId} onValueChange={(val) => handleApplyTemplate(val, false)}>
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {communicationTemplates
                          .filter((t) => replyChannel === "note" || t.type === replyChannel)
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reply input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      replyChannel === "note"
                        ? "Add an internal note..."
                        : replyChannel === "whatsapp"
                        ? "Type a WhatsApp message..."
                        : "Type your email reply..."
                    }
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="min-h-[60px] max-h-32 text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSendReply()
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0",
                        replyChannel === "whatsapp" ? "bg-[#25D366] hover:bg-[#1eb954]" : replyChannel === "note" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                      )}
                      onClick={handleSendReply}
                      disabled={sendingMessage || !replyBody.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-10 p-0" title="Attach">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {replyChannel === "whatsapp" && replyBody && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{replyBody.length} characters</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── TAB 2: Compose ───────────────────────────────────────────────────
  const renderCompose = () => (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <PenSquare className="w-5 h-5 text-emerald-600" />
            New Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium w-16">Channel</Label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={composeChannel === "email" ? "default" : "ghost"}
                className={cn("h-9 gap-2", composeChannel === "email" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                onClick={() => setComposeChannel("email")}
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button
                variant={composeChannel === "whatsapp" ? "default" : "ghost"}
                className={cn("h-9 gap-2", composeChannel === "whatsapp" && "bg-[#25D366] hover:bg-[#1eb954] text-white")}
                onClick={() => setComposeChannel("whatsapp")}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* From */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium w-16">From</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {currentUser ? getInitials(currentUser.name) : "U"}
                </AvatarFallback>
              </Avatar>
              {currentUser?.name || "Current User"} ({currentUser?.email || ""})
            </div>
          </div>

          {/* To - with autocomplete */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium w-16">To</Label>
            <div className="flex-1 relative">
              <Input
                placeholder={composeChannel === "email" ? "Search name or email..." : "Search name or phone..."}
                value={composeTo || recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value)
                  setComposeTo(e.target.value)
                  setShowRecipientDropdown(true)
                }}
                onFocus={() => setShowRecipientDropdown(true)}
                className="h-9 text-sm"
              />
              {showRecipientDropdown && recipientSearch.length > 0 && filteredRecipients.length > 0 && (
                <div className="absolute z-50 top-10 left-0 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredRecipients.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                      onClick={() => handleSelectRecipient(r)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[8px]">{getInitials(r.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          {r.email && <div className="text-[10px] text-muted-foreground">{r.email}</div>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                        {r.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              {showRecipientDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRecipientDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Subject (email only) */}
          {composeChannel === "email" && (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium w-16">Subject</Label>
              <Input
                placeholder="Email subject..."
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Template selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium w-16">Template</Label>
            <Select value={composeTemplateId} onValueChange={(val) => handleApplyTemplate(val, true)}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {communicationTemplates
                  .filter((t) => t.type === composeChannel)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.subject && `- ${t.subject}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Message</Label>
            <Textarea
              placeholder={composeChannel === "email" ? "Write your email..." : "Type your WhatsApp message..."}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="min-h-[200px] text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach
                </Button>
                {composeChannel === "email" && (
                  <>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => setComposeBody(composeBody + "<b></b>")}>B</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs italic" onClick={() => setComposeBody(composeBody + "<i></i>")}>I</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setComposeBody(composeBody + "{{name}}")}>
                      <Sparkles className="w-3 h-3" /> Variable
                    </Button>
                  </>
                )}
              </div>
              {composeChannel === "whatsapp" && composeBody && (
                <span className="text-[10px] text-muted-foreground">{composeBody.length} characters</span>
              )}
            </div>
            {/* Detected variables */}
            {composeBody && extractVariables(composeBody).length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Variables:</span>
                {extractVariables(composeBody).map((v) => (
                  <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              className={cn(
                "gap-2",
                composeChannel === "whatsapp" ? "bg-[#25D366] hover:bg-[#1eb954]" : "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={handleSendCompose}
              disabled={sendingMessage || !composeBody.trim()}
            >
              {sendingMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send {composeChannel === "email" ? "Email" : "WhatsApp"}
            </Button>
            <Button variant="outline" onClick={() => { setComposeBody(""); setComposeSubject(""); setComposeTo(""); setComposeToEmail(""); setComposeToPhone(""); setComposeTemplateId(""); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ── TAB 3: Templates ─────────────────────────────────────────────────
  const renderTemplates = () => (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            {(["all", "email", "whatsapp"] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={templateTypeFilter === t ? "default" : "ghost"}
                className={cn(
                  "h-7 text-xs px-3",
                  templateTypeFilter === t && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={() => setTemplateTypeFilter(t)}
              >
                {t === "all" ? "All" : t === "email" ? <><Mail className="w-3.5 h-3.5 mr-1" /> Email</> : <><MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp</>}
              </Button>
            ))}
          </div>
        </div>
        <Dialog onOpenChange={(open) => { if (!open) { setEditingTemplate(null); setTemplateName(""); setTemplateType("email"); setTemplateCategory(""); setTemplateSubject(""); setTemplateBody(""); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Input value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} placeholder="e.g. outreach, follow-up" className="mt-1 h-9 text-sm" />
                </div>
                {templateType === "email" && (
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <Input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Email subject" className="mt-1 h-9 text-sm" />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Body</Label>
                <Textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Write template body... Use {{name}}, {{company}}, {{date}} for variables"
                  className="mt-1 min-h-[150px] text-sm resize-none"
                />
              </div>
              {templateBody && extractVariables(templateBody).length > 0 && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Detected variables:</span>
                  {extractVariables(templateBody).map((v) => (
                    <Badge key={v} variant="outline" className="text-xs px-2 py-0.5 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              )}
              {/* Preview */}
              {templateBody && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="rounded-md border p-3 bg-muted/30 text-sm">
                    {templateBody
                      .replace(/\{\{name\}\}/g, "John Doe")
                      .replace(/\{\{company\}\}/g, "Acme Inc")
                      .replace(/\{\{date\}\}/g, format(new Date(), "MMMM d, yyyy"))
                      .replace(/\{\{email\}\}/g, "john@example.com")}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTemplate} className="bg-emerald-600 hover:bg-emerald-700" disabled={!templateName.trim() || !templateBody.trim()}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="text-xs mt-1">Create your first template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const vars = extractVariables(template.body)
            return (
              <motion.div key={template.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setEditingTemplate(template); setTemplateName(template.name); setTemplateType(template.type); setTemplateCategory(template.category || ""); setTemplateSubject(template.subject || ""); setTemplateBody(template.body); }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                      <Badge className={cn("text-[10px] px-1.5 py-0 h-4 border-0", template.type === "whatsapp" ? "bg-[#25D366]/20 text-[#25D366]" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300")}>
                        {template.type === "whatsapp" ? <MessageCircle className="w-2.5 h-2.5 mr-0.5" /> : <Mail className="w-2.5 h-2.5 mr-0.5" />}
                        {template.type}
                      </Badge>
                    </div>
                    {template.category && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 w-fit">
                        {template.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {template.subject && (
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{template.subject}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-3">{template.body}</p>
                    {vars.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {vars.map((v) => (
                          <Badge key={v} variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── TAB 4: Contacts ──────────────────────────────────────────────────
  const renderContacts = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="pl-9 h-9 w-64 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Favorites</Label>
            <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} />
          </div>
        </div>
        <Dialog onOpenChange={(open) => { if (!open) { setEditingContact(null); setContactName(""); setContactEmail(""); setContactPhone(""); setContactWhatsapp(""); setContactCompany(""); setContactRole(""); setContactPreferredChannel("email"); setContactNotes(""); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className="mt-1 h-9 text-sm" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1-555-0100" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-medium">WhatsApp Number</Label>
                  <Input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+1-555-0100" className="mt-1 h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <Input value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} placeholder="Company name" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Select value={contactRole} onValueChange={setContactRole}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Preferred Channel</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="sm"
                    variant={contactPreferredChannel === "email" ? "default" : "outline"}
                    className={cn("gap-1.5", contactPreferredChannel === "email" && "bg-emerald-600 hover:bg-emerald-700")}
                    onClick={() => setContactPreferredChannel("email")}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Button>
                  <Button
                    size="sm"
                    variant={contactPreferredChannel === "whatsapp" ? "default" : "outline"}
                    className={cn("gap-1.5", contactPreferredChannel === "whatsapp" && "bg-[#25D366] hover:bg-[#1eb954]")}
                    onClick={() => setContactPreferredChannel("whatsapp")}
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} placeholder="Additional notes..." className="mt-1 h-20 text-sm resize-none" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveContact} className="bg-emerald-600 hover:bg-emerald-700" disabled={!contactName.trim()}>
                Save Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Favorite contacts */}
      {showFavoritesOnly && filteredContacts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-500" /> Favorite Contacts
          </h3>
        </div>
      )}

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No contacts found</p>
          <p className="text-xs mt-1">Add contacts to your communication directory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold truncate">{contact.name}</h4>
                        {contact.isFavorite && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 flex-shrink-0" />}
                      </div>
                      {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                      {contact.role && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-1 capitalize">
                          {contact.role}
                        </Badge>
                      )}
                    </div>
                    {/* Preferred channel */}
                    <div className="flex-shrink-0">
                      {contact.preferredChannel === "whatsapp" ? (
                        <div className="flex items-center justify-center rounded-full w-7 h-7" style={{ backgroundColor: WA_GREEN + "20" }}>
                          <MessageCircle className="w-4 h-4" style={{ color: WA_GREEN }} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-full w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40">
                          <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-600 transition-colors">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-600 transition-colors">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </a>
                    )}
                    {contact.whatsappNumber && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: WA_GREEN }} />
                        <span>{contact.whatsappNumber}</span>
                      </div>
                    )}
                    {contact.lastContactedAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Last contacted {formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    {contact.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => {
                          setActiveTab("compose")
                          setComposeChannel("email")
                          setComposeTo(contact.name)
                          setComposeToEmail(contact.email || "")
                          setComposeToPhone(contact.whatsappNumber || contact.phone || "")
                        }}
                      >
                        <Mail className="w-3 h-3" /> Email
                      </Button>
                    )}
                    {contact.whatsappNumber && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 hover:bg-[#25D366]/10"
                        style={{ color: WA_GREEN }}
                        onClick={() => {
                          setActiveTab("compose")
                          setComposeChannel("whatsapp")
                          setComposeTo(contact.name)
                          setComposeToEmail(contact.email || "")
                          setComposeToPhone(contact.whatsappNumber)
                        }}
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 ml-auto"
                      onClick={() => handleToggleFavorite(contact.id, contact.isFavorite)}
                    >
                      {contact.isFavorite ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  // ── TAB 5: Analytics ─────────────────────────────────────────────────
  const renderAnalytics = () => {
    const maxDailyVolume = Math.max(...analytics.dailyVolumes.map((d) => d.email + d.whatsapp), 1)
    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sent", value: analytics.totalSent, icon: Send, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/40" },
            { label: "Open Rate", value: `${analytics.openRate}%`, icon: MailOpen, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/40" },
            { label: "Reply Rate", value: `${analytics.replyRate}%`, icon: Reply, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/40" },
            { label: "Avg Response", value: `${analytics.avgResponseMin}m`, icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/40" },
          ].map((kpi) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center justify-center rounded-lg w-10 h-10", kpi.bgColor)}>
                      <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Channel Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-full w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40">
                      <Mail className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${analytics.emailCount + analytics.whatsappCount > 0 ? (analytics.emailCount / (analytics.emailCount + analytics.whatsappCount)) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{analytics.emailCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-full w-8 h-8" style={{ backgroundColor: WA_GREEN + "20" }}>
                      <MessageCircle className="w-4 h-4" style={{ color: WA_GREEN }} />
                    </div>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${analytics.emailCount + analytics.whatsappCount > 0 ? (analytics.whatsappCount / (analytics.emailCount + analytics.whatsappCount)) * 100 : 0}%`, backgroundColor: WA_GREEN }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{analytics.whatsappCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Volume Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Daily Volume (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {analytics.dailyVolumes.map((day) => {
                  const emailH = maxDailyVolume > 0 ? (day.email / maxDailyVolume) * 100 : 0
                  const waH = maxDailyVolume > 0 ? (day.whatsapp / maxDailyVolume) * 100 : 0
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-end gap-0.5 w-full h-28">
                        <div className="flex-1 bg-emerald-400 rounded-t transition-all" style={{ height: `${Math.max(emailH, 4)}%` }} title={`${day.email} emails`} />
                        <div className="flex-1 rounded-t transition-all" style={{ height: `${Math.max(waH, 4)}%`, backgroundColor: WA_GREEN }} title={`${day.whatsapp} WA`} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{day.date}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">Email</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: WA_GREEN }} />
                  <span className="text-[10px] text-muted-foreground">WhatsApp</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Contacts & Template Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Top Contacts by Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No message data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topContacts.map((contact, i) => {
                    const maxCount = analytics.topContacts[0]?.count || 1
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{contact.name}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{contact.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(contact.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Template Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No template usage data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topTemplates.map((tmpl, i) => {
                    const maxCount = analytics.topTemplates[0]?.count || 1
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-900/40">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{tmpl.name}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{tmpl.count} uses</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(tmpl.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40">
              <Inbox className="w-5 h-5 text-emerald-600" />
            </div>
            Communication Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage conversations across email and WhatsApp
            {totalUnread > 0 && (
              <span className="ml-2 text-emerald-600 font-medium">{totalUnread} unread</span>
            )}
          </p>
        </div>
        <Button
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setActiveTab("compose")}
        >
          <PenSquare className="w-4 h-4" />
          Compose
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="w-4 h-4" />
            Inbox
            {totalUnread > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {totalUnread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-1.5">
            <PenSquare className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5">
            <Users className="w-4 h-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          {renderInbox()}
        </TabsContent>
        <TabsContent value="compose" className="mt-4">
          {renderCompose()}
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          {renderTemplates()}
        </TabsContent>
        <TabsContent value="contacts" className="mt-4">
          {renderContacts()}
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
