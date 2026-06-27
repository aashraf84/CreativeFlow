"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type InboxMessage, type Platform } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import {
  Inbox,
  MessageSquare,
  AtSign,
  Mail,
  Reply,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Clock,
  ExternalLink,
  Send,
  Search,
  ArrowLeft,
  MessageCircle,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

// ── Platform Configuration ──────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  textColor: string
}> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#E4405F", bgColor: "bg-pink-50 dark:bg-pink-950/30", textColor: "text-pink-600 dark:text-pink-400" },
  facebook: { label: "Facebook", icon: Facebook, color: "#1877F2", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-600 dark:text-blue-400" },
  twitter: { label: "Twitter", icon: Twitter, color: "#1DA1F2", bgColor: "bg-sky-50 dark:bg-sky-950/30", textColor: "text-sky-600 dark:text-sky-400" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "#0A66C2", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-700 dark:text-blue-400" },
  tiktok: { label: "TikTok", icon: () => <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43V12.5a8.28 8.28 0 005.58 2.17V11.2a4.83 4.83 0 01-3.77-1.73V6.69h3.77z"/></svg>, color: "#000000", bgColor: "bg-gray-50 dark:bg-gray-950/30", textColor: "text-gray-700 dark:text-gray-300" },
  youtube: { label: "YouTube", icon: () => <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, color: "#FF0000", bgColor: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-600 dark:text-red-400" },
  pinterest: { label: "Pinterest", icon: () => <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>, color: "#E60023", bgColor: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-600 dark:text-red-400" },
  snapchat: { label: "Snapchat", icon: () => <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.4-.15.842-.318 1.33-.318.316 0 .598.058.845.165.614.26.932.7.96 1.293.03.6-.28 1.122-.9 1.508-.352.217-.836.4-1.307.579-.264.1-.535.203-.763.313-.2.098-.303.194-.34.248a.737.737 0 00.046.191c.183.523.538.973.877 1.38.096.115.191.228.281.34.295.366.576.742.666 1.176.068.329.014.633-.155.878-.192.278-.503.431-.869.431-.175 0-.346-.034-.508-.07-.16-.036-.322-.084-.482-.132a5.28 5.28 0 00-.532-.136 2.24 2.24 0 00-.43-.044c-.162 0-.307.022-.442.065-.296.096-.545.288-.803.487l-.015.012c-.528.408-1.135.87-2.143.87h-.038c-1.008 0-1.614-.462-2.143-.87l-.015-.012c-.258-.2-.507-.391-.803-.487a1.613 1.613 0 00-.442-.065c-.147 0-.29.015-.43.044a5.36 5.36 0 00-.532.136c-.16.048-.322.096-.482.132-.163.036-.333.07-.508.07-.366 0-.677-.153-.869-.431-.169-.245-.223-.549-.155-.878.09-.434.371-.81.666-1.176.09-.112.185-.225.281-.34.339-.407.694-.857.877-1.38a.737.737 0 00.046-.191c-.037-.054-.14-.15-.34-.248a8.31 8.31 0 00-.763-.313c-.471-.179-.955-.362-1.307-.579-.62-.386-.93-.908-.9-1.508.028-.593.346-1.033.96-1.293.247-.107.529-.165.845-.165.488 0 .93.168 1.33.318.263.094.622.198.922.214.198 0 .326-.045.401-.09a15.93 15.93 0 01-.033-.57c-.104-1.628-.23-3.654.299-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>, color: "#FFFC00", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", textColor: "text-yellow-600 dark:text-yellow-400" },
}

// ── Message Type Configuration ──────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  comment: { label: "Comment", icon: MessageSquare, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  mention: { label: "Mention", icon: AtSign, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  dm: { label: "DM", icon: Mail, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  reply: { label: "Reply", icon: Reply, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  review: { label: "Review", icon: Star, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
}

// ── Status Configuration ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  dotColor: string
}> = {
  unread: { label: "Unread", icon: Eye, color: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500" },
  read: { label: "Read", icon: Eye, color: "text-muted-foreground", dotColor: "" },
  replied: { label: "Replied", icon: CheckCircle2, color: "text-teal-600 dark:text-teal-400", dotColor: "" },
  ignored: { label: "Ignored", icon: XCircle, color: "text-muted-foreground/60", dotColor: "" },
}

// ── Animation Variants ──────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

const panelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
}

// ── Helper Functions ────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(/[\s._]/).filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

function getRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return "Unknown"
  }
}

function truncateContent(content: string, maxLength: number = 120): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + "..."
}

// ── Platform Filter Options ─────────────────────────────────────────────
const PLATFORM_FILTERS: { key: string; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "All" },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "twitter", label: "Twitter", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "tiktok", label: "TikTok" },
]

// ── Main Component ──────────────────────────────────────────────────────
export function InboxView() {
  const { inboxMessages, setInboxMessages, socialAccounts, currentUser } = useERPStore()
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // Computed values
  const stats = useMemo(() => {
    const unread = inboxMessages.filter(m => m.status === "unread").length
    const comments = inboxMessages.filter(m => m.type === "comment").length
    const mentions = inboxMessages.filter(m => m.type === "mention").length
    const dms = inboxMessages.filter(m => m.type === "dm").length
    return { unread, comments, mentions, dms }
  }, [inboxMessages])

  const filteredMessages = useMemo(() => {
    return inboxMessages.filter(msg => {
      if (platformFilter !== "all" && msg.platform !== platformFilter) return false
      if (statusFilter !== "all" && msg.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          msg.content.toLowerCase().includes(q) ||
          msg.senderName.toLowerCase().includes(q) ||
          msg.type.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [inboxMessages, platformFilter, statusFilter, searchQuery])

  const selectedMessage = useMemo(() => {
    return inboxMessages.find(m => m.id === selectedMessageId) || null
  }, [inboxMessages, selectedMessageId])

  // Actions
  const updateMessageStatus = useCallback(async (messageId: string, status: string) => {
    try {
      const res = await fetch(`/api/inbox/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setInboxMessages(
          inboxMessages.map(m => m.id === messageId ? { ...m, ...data.message, status, repliedAt: status === "replied" ? new Date().toISOString() : m.repliedAt } : m)
        )
        if (status === "ignored") {
          setSelectedMessageId(null)
          setShowMobileDetail(false)
        }
      }
    } catch (err) {
      console.error("Failed to update message:", err)
    }
  }, [inboxMessages, setInboxMessages])

  const handleReply = useCallback(async () => {
    if (!selectedMessage || !replyText.trim()) return
    setIsSending(true)
    try {
      await updateMessageStatus(selectedMessage.id, "replied")
      setReplyText("")
    } finally {
      setIsSending(false)
    }
  }, [selectedMessage, replyText, updateMessageStatus])

  const handleMessageSelect = useCallback((msg: InboxMessage) => {
    setSelectedMessageId(msg.id)
    setShowMobileDetail(true)
    // Auto-mark as read when selected
    if (msg.status === "unread") {
      updateMessageStatus(msg.id, "read")
    }
  }, [updateMessageStatus])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Social Inbox</h1>
              <p className="text-sm text-muted-foreground">Unified social media message management</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Unread", value: stats.unread, icon: Inbox, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Comments", value: stats.comments, icon: MessageSquare, color: "from-teal-500 to-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
            { label: "Mentions", value: stats.mentions, icon: AtSign, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
            { label: "DMs", value: stats.dms, icon: Mail, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", stat.bg)}>
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                    </div>
                    <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm", stat.color)}>
                      <stat.icon className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-4">
        {/* Left: Message List */}
        <div className={cn(
          "flex flex-col min-h-0 transition-all duration-300",
          selectedMessage ? "w-full lg:w-1/2 xl:w-3/5" : "w-full"
        )}>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            {/* Platform Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
              {PLATFORM_FILTERS.map((pf) => {
                const Icon = pf.icon
                const isActive = platformFilter === pf.key
                return (
                  <button
                    key={pf.key}
                    onClick={() => setPlatformFilter(pf.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {pf.label}
                    {pf.key !== "all" && (
                      <span className="text-[10px] opacity-60">
                        {inboxMessages.filter(m => m.platform === pf.key).length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search & Status */}
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-1">
                {["all", "unread", "read", "replied", "ignored"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-2 py-1.5 rounded-md text-[11px] font-medium transition-all capitalize",
                      statusFilter === s
                        ? "bg-accent text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message List */}
          <Card className="flex-1 min-h-0 border-0 shadow-sm">
            <ScrollArea className="h-full">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <MessageCircle className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium">No messages found</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  <AnimatePresence>
                    {filteredMessages.map((msg, index) => (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        isSelected={selectedMessageId === msg.id}
                        onSelect={handleMessageSelect}
                        onStatusChange={updateMessageStatus}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Right: Detail Panel */}
        <AnimatePresence>
          {selectedMessage && (
            <motion.div
              className={cn(
                "w-full lg:w-1/2 xl:w-2/5 flex-shrink-0",
                showMobileDetail ? "block" : "hidden lg:block"
              )}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="h-full border-0 shadow-sm flex flex-col">
                {/* Panel Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden -ml-2"
                      onClick={() => { setShowMobileDetail(false); setSelectedMessageId(null) }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <div className="flex items-center gap-2 ml-auto">
                      {selectedMessage.postUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={selectedMessage.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Open original post</TooltipContent>
                        </Tooltip>
                      )}
                      <Badge
                        className={cn(
                          "text-[11px]",
                          STATUS_CONFIG[selectedMessage.status]?.color,
                          selectedMessage.status === "unread" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                          selectedMessage.status === "replied" && "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
                          selectedMessage.status === "ignored" && "bg-muted/50 text-muted-foreground border-muted",
                          selectedMessage.status === "read" && "bg-muted/50 text-muted-foreground border-muted",
                        )}
                        variant="outline"
                      >
                        {(() => {
                        const StatusIcon = STATUS_CONFIG[selectedMessage.status]?.icon
                        return StatusIcon ? <StatusIcon className="h-3 w-3 mr-1" /> : null
                      })()}
                        {STATUS_CONFIG[selectedMessage.status]?.label || selectedMessage.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Sender Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                      {selectedMessage.senderAvatar && <AvatarImage src={selectedMessage.senderAvatar} />}
                      <AvatarFallback className={cn("text-sm font-semibold", PLATFORM_CONFIG[selectedMessage.platform]?.bgColor, PLATFORM_CONFIG[selectedMessage.platform]?.textColor)}>
                        {getInitials(selectedMessage.senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{selectedMessage.senderName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(() => {
                          const pConfig = PLATFORM_CONFIG[selectedMessage.platform]
                          const PIcon = pConfig?.icon
                          return PIcon ? (
                            <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", pConfig?.textColor)}>
                              <span className="h-4 w-4"><PIcon className="h-4 w-4" /></span>
                              {pConfig?.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground capitalize">{selectedMessage.platform}</span>
                          )
                        })()}
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", TYPE_CONFIG[selectedMessage.type]?.color)} variant="secondary">
                          {(() => {
                          const TypeIcon = TYPE_CONFIG[selectedMessage.type]?.icon
                          return TypeIcon ? <TypeIcon className="h-3 w-3 mr-0.5" /> : null
                        })()}
                          {TYPE_CONFIG[selectedMessage.type]?.label || selectedMessage.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-sm leading-relaxed">{selectedMessage.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getRelativeTime(selectedMessage.createdAt)}
                    </p>
                  </div>

                  {selectedMessage.repliedAt && (
                    <div className="mt-4 pl-4 border-l-2 border-teal-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          {currentUser?.avatar && <AvatarImage src={currentUser.avatar} />}
                          <AvatarFallback className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                            {getInitials(currentUser?.name || "You")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-teal-600 dark:text-teal-400">You replied</span>
                        <span className="text-[11px] text-muted-foreground">{getRelativeTime(selectedMessage.repliedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply / Actions */}
                <div className="p-4 border-t border-border/50">
                  {selectedMessage.status !== "ignored" && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[80px] resize-none text-sm border-border/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                        disabled={selectedMessage.status === "replied" || selectedMessage.status === "ignored"}
                      />
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          {selectedMessage.status !== "replied" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
                              onClick={handleReply}
                              disabled={!replyText.trim() || isSending}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {isSending ? "Sending..." : "Reply"}
                            </Button>
                          )}
                          {selectedMessage.status === "unread" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMessageStatus(selectedMessage.id, "read")}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                        {selectedMessage.status !== "ignored" && selectedMessage.status !== "replied" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-rose-600"
                            onClick={() => updateMessageStatus(selectedMessage.id, "ignored")}
                          >
                            <EyeOff className="h-3.5 w-3.5 mr-1" />
                            Ignore
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedMessage.status === "ignored" && (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      This message has been ignored
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Message Card Component ──────────────────────────────────────────────
function MessageCard({
  message,
  isSelected,
  onSelect,
  onStatusChange,
  index,
}: {
  message: InboxMessage
  isSelected: boolean
  onSelect: (msg: InboxMessage) => void
  onStatusChange: (id: string, status: string) => void
  index: number
}) {
  const platformConfig = PLATFORM_CONFIG[message.platform]
  const typeConfig = TYPE_CONFIG[message.type]
  const statusConfig = STATUS_CONFIG[message.status]
  const PIcon = platformConfig?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <button
        onClick={() => onSelect(message)}
        className={cn(
          "w-full text-left px-4 py-3.5 transition-all duration-150 hover:bg-accent/50 group",
          isSelected && "bg-emerald-500/5 border-l-2 border-l-emerald-500",
          message.status === "unread" && !isSelected && "bg-emerald-500/[0.02]",
          message.status === "ignored" && "opacity-50",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Platform Icon */}
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
            platformConfig?.bgColor
          )}>
            {PIcon && <span className={cn("h-4 w-4", platformConfig?.textColor)}><PIcon className="h-4 w-4" /></span>}
          </div>

          {/* Unread indicator */}
          <div className="flex flex-col items-center pt-2 flex-shrink-0">
            {message.status === "unread" && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            )}
            {message.status === "replied" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                "text-sm font-medium truncate",
                message.status === "unread" ? "font-semibold" : "font-normal"
              )}>
                {message.senderName}
              </span>
              <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", typeConfig?.color)} variant="secondary">
                {typeConfig?.label || message.type}
              </Badge>
              <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">
                {getRelativeTime(message.createdAt)}
              </span>
            </div>
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              message.status === "unread" && "text-foreground/80"
            )}>
              {truncateContent(message.content, 100)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {message.status === "unread" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(message.id, "read") }}
                    className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Mark as read</TooltipContent>
              </Tooltip>
            )}
            {message.status !== "replied" && message.status !== "ignored" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(message.id, "ignored") }}
                    className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Ignore</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  )
}
