"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useERPStore, type Content, type ContentStage, type ContentPriority, type ContentType } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  PenTool,
  Pencil,
  Eye,
  CheckCircle2,
  Send,
  Archive,
  ArrowRight,
  PencilLine,
  X,
  MessageSquare,
  CalendarIcon,
  Tag,
  FileText,
  Film,
  Layers,
  Video,
  Palette,
  Type,
  Image,
  Clock,
  User,
  Users,
  FolderOpen,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";

// ─── Stage Configuration ──────────────────────────────────────────────────────

const STAGES_CONFIG: { key: ContentStage; label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "idea", label: "Idea", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800/50", icon: Lightbulb },
  { key: "design", label: "Design", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-50 dark:bg-violet-900/20", icon: PenTool },
  { key: "edit", label: "Edit", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/20", icon: Pencil },
  { key: "review", label: "Review", color: "text-sky-600 dark:text-sky-400", bgColor: "bg-sky-50 dark:bg-sky-900/20", icon: Eye },
  { key: "approve", label: "Approve", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
  { key: "disseminate", label: "Disseminate", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-50 dark:bg-teal-900/20", icon: Send },
  { key: "archived", label: "Archived", color: "text-gray-500 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800/50", icon: Archive },
];

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  post: { label: "Post", icon: FileText },
  story: { label: "Story", icon: Image },
  reel: { label: "Reel", icon: Film },
  carousel: { label: "Carousel", icon: Layers },
  video: { label: "Video", icon: Video },
  graphic: { label: "Graphic", icon: Palette },
  article: { label: "Article", icon: Type },
};

const PRIORITY_CONFIG: Record<ContentPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-slate-700 dark:text-slate-300", bgColor: "bg-slate-100 dark:bg-slate-800" },
  medium: { label: "Medium", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  high: { label: "High", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  urgent: { label: "Urgent", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Youtube,
  youtube: Youtube,
};

const POST_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  publishing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ACTIVE_STAGES: ContentStage[] = ["idea", "design", "edit", "review", "approve", "disseminate"];

export function ContentDetailModal() {
  const { selectedContent, setSelectedContent, contents, setContents, currentUser } = useERPStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isMovingStage, setIsMovingStage] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<ContentType>("post");
  const [editPriority, setEditPriority] = useState<ContentPriority>("medium");
  const [editFormat, setEditFormat] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit fields when content changes
  const initializeEditFields = useCallback((content: Content) => {
    setEditTitle(content.title);
    setEditDescription(content.description || "");
    setEditType(content.type);
    setEditPriority(content.priority);
    setEditFormat(content.format || "");
    setEditTags(content.tags || "");
    setEditDueDate(content.dueDate ? formatDate(new Date(content.dueDate), "yyyy-MM-dd") : "");
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
      setCommentText("");
      setSelectedContent(null);
    }
  };

  const handleEdit = () => {
    if (selectedContent) {
      initializeEditFields(selectedContent);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedContent) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contents/${selectedContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          type: editType,
          priority: editPriority,
          format: editFormat || null,
          tags: editTags.trim() || null,
          dueDate: editDueDate || null,
          actorId: currentUser?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to update content");

      const updatedContent = await res.json();
      // Update in store
      setContents(
        contents.map((c) => (c.id === updatedContent.id ? { ...c, ...updatedContent, posts: c.posts, comments: c.comments } : c))
      );
      setSelectedContent({ ...selectedContent, ...updatedContent, posts: selectedContent.posts, comments: selectedContent.comments });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveToNextStage = async () => {
    if (!selectedContent) return;
    const currentIndex = ACTIVE_STAGES.indexOf(selectedContent.stage);
    if (currentIndex === -1 || currentIndex >= ACTIVE_STAGES.length - 1) return;

    const nextStage = ACTIVE_STAGES[currentIndex + 1];
    setIsMovingStage(true);

    try {
      const res = await fetch(`/api/contents/${selectedContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: nextStage,
          actorId: currentUser?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to update stage");

      const updatedContent = await res.json();
      const newContent = { ...selectedContent, ...updatedContent, posts: selectedContent.posts, comments: selectedContent.comments };
      setContents(
        contents.map((c) => (c.id === updatedContent.id ? { ...c, ...updatedContent, posts: c.posts, comments: c.comments } : c))
      );
      setSelectedContent(newContent);
    } catch (error) {
      console.error("Failed to move to next stage:", error);
    } finally {
      setIsMovingStage(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedContent || !commentText.trim() || !currentUser) return;
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/contents/${selectedContent.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText.trim(),
          userId: currentUser.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const newComment = await res.json();
      const updatedComments = [newComment, ...selectedContent.comments];
      const newContent = { ...selectedContent, comments: updatedComments };
      setSelectedContent(newContent);
      setContents(
        contents.map((c) => (c.id === selectedContent.id ? { ...c, comments: updatedComments } : c))
      );
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Stage progress calculation
  const stageProgress = useMemo(() => {
    if (!selectedContent) return 0;
    const currentIndex = ACTIVE_STAGES.indexOf(selectedContent.stage);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / ACTIVE_STAGES.length) * 100;
  }, [selectedContent]);

  // Can move to next stage?
  const canMoveNext = useMemo(() => {
    if (!selectedContent) return false;
    const currentIndex = ACTIVE_STAGES.indexOf(selectedContent.stage);
    return currentIndex !== -1 && currentIndex < ACTIVE_STAGES.length - 1;
  }, [selectedContent]);

  if (!selectedContent) return null;

  const content = selectedContent;
  const stageConfig = STAGES_CONFIG.find((s) => s.key === content.stage) || STAGES_CONFIG[0];
  const typeConfig = CONTENT_TYPE_CONFIG[content.type] || CONTENT_TYPE_CONFIG.post;
  const priorityConfig = PRIORITY_CONFIG[content.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConfig.icon;
  const StageIcon = stageConfig.icon;

  return (
    <Dialog open={!!selectedContent} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl leading-tight">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-semibold h-auto py-0"
                    />
                  ) : (
                    content.title
                  )}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Content details for {content.title}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn("gap-1", stageConfig.bgColor, stageConfig.color, "border-0")}>
                  <StageIcon className="h-3 w-3" />
                  {stageConfig.label}
                </Badge>
                <Badge className={cn("gap-1", priorityConfig.bgColor, priorityConfig.color, "border-0")}>
                  {priorityConfig.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Stage Progress */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stage Progress
              </Label>
              <div className="flex items-center gap-1">
                {ACTIVE_STAGES.map((stage, index) => {
                  const isActive = content.stage === stage;
                  const isPast = ACTIVE_STAGES.indexOf(content.stage) > index;
                  const isArchived = content.stage === "archived";
                  const sConfig = STAGES_CONFIG.find((s) => s.key === stage)!;
                  const SIcon = sConfig.icon;

                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all",
                            isActive
                              ? `${sConfig.bgColor} ${sConfig.color} border-current`
                              : isPast && !isArchived
                              ? "bg-emerald-100 text-emerald-600 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500"
                              : "bg-muted text-muted-foreground border-muted"
                          )}
                        >
                          {isPast && !isActive ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <SIcon className="h-4 w-4" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium leading-tight text-center",
                            isActive ? sConfig.color : isPast ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )}
                        >
                          {sConfig.label}
                        </span>
                      </div>
                      {index < ACTIVE_STAGES.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 w-full mt-[-1.25rem] rounded-full",
                            isPast && !isArchived
                              ? "bg-emerald-400 dark:bg-emerald-600"
                              : "bg-muted"
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${content.stage === "archived" ? 100 : stageProgress}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Details Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Details
              </Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Description */}
                <div className="col-span-2 space-y-1.5">
                  <span className="text-xs text-muted-foreground">Description</span>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">
                      {content.description || <span className="text-muted-foreground italic">No description</span>}
                    </p>
                  )}
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Format</span>
                  {isEditing ? (
                    <Select value={editFormat} onValueChange={setEditFormat}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square (1:1)</SelectItem>
                        <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                        <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{content.format || <span className="text-muted-foreground italic">Not set</span>}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </span>
                  {isEditing ? (
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Comma-separated tags"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {content.tags ? (
                        content.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No tags</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> Due Date
                  </span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {content.dueDate
                        ? formatDate(new Date(content.dueDate), "MMM d, yyyy")
                        : <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Created / Updated */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created
                  </span>
                  <p className="text-sm">{formatDate(new Date(content.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Updated</span>
                  <p className="text-sm">{formatDate(new Date(content.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>

                {/* Type & Priority (editable) */}
                {isEditing && (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <Select value={editType} onValueChange={(v) => setEditType(v as ContentType)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className="h-3.5 w-3.5" />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Priority</span>
                      <Select value={editPriority} onValueChange={(v) => setEditPriority(v as ContentPriority)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <span className={cn("inline-block h-2 w-2 rounded-full", cfg.bgColor)} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Assignment Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Assignment
              </Label>

              <div className="grid grid-cols-3 gap-4">
                {/* Creator */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Creator</span>
                  {content.creator ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={content.creator.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {content.creator.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{content.creator.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  )}
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Assignee</span>
                  {content.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={content.assignee.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {content.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{content.assignee.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  )}
                </div>

                {/* Team */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Team
                  </span>
                  {content.team ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: content.team.color }}
                      />
                      <span className="text-sm font-medium truncate">{content.team.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No team</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Campaign Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" />
                Campaign
              </Label>

              {content.campaign ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Campaign</span>
                    <p className="text-sm font-medium">{content.campaign.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Client</span>
                    <p className="text-sm">{content.campaign.client?.name || "—"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        content.campaign.status === "active"
                          ? "border-emerald-500 text-emerald-600"
                          : content.campaign.status === "completed"
                          ? "border-blue-500 text-blue-600"
                          : "border-muted-foreground"
                      )}
                    >
                      {content.campaign.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No campaign linked</p>
              )}
            </div>

            <Separator />

            {/* Connected Posts Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Send className="h-3.5 w-3.5" />
                Connected Posts
                {content.posts.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{content.posts.length}</Badge>
                )}
              </Label>

              {content.posts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {content.posts.map((post) => {
                    const PlatformIcon = PLATFORM_ICONS[post.platform] || FileText;
                    return (
                      <div
                        key={post.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted shrink-0">
                          <PlatformIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{post.content.substring(0, 60)}{post.content.length > 60 ? "..." : ""}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{post.platform}</span>
                            <span>·</span>
                            <span>{post.scheduledAt ? formatDate(new Date(post.scheduledAt), "MMM d, h:mm a") : "Not scheduled"}</span>
                          </div>
                        </div>
                        <Badge className={cn("text-[10px] border-0", POST_STATUS_COLORS[post.status] || "bg-muted")}>
                          {post.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No posts linked to this content</p>
              )}
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
                {content.comments.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{content.comments.length}</Badge>
                )}
              </Label>

              {/* Add Comment Form */}
              <div className="flex gap-2">
                {currentUser && (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarImage src={currentUser.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : null}
                      Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comment List */}
              {content.comments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {content.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={comment.user.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {comment.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(comment.createdAt), "MMM d 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No comments yet</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canMoveNext && !isEditing && (
                <Button
                  onClick={handleMoveToNextStage}
                  disabled={isMovingStage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isMovingStage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Move to {ACTIVE_STAGES[ACTIVE_STAGES.indexOf(content.stage) + 1]}
                  {STAGES_CONFIG.find((s) => s.key === ACTIVE_STAGES[ACTIVE_STAGES.indexOf(content.stage) + 1])?.label}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="gap-1"
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
