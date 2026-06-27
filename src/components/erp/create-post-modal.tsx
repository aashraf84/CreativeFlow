"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type Platform, type PostStatus } from "@/lib/store";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  CalendarIcon,
  Clock,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Image as ImageIcon,
  Eye,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";

const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  twitter: 280,
  linkedin: 3000,
  tiktok: 2200,
  facebook: 63206,
  youtube: 5000,
  pinterest: 500,
  snapchat: 250,
};

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Youtube,
  youtube: Youtube,
  pinterest: ImageIcon,
  snapchat: ImageIcon,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-black dark:bg-white dark:text-black",
  youtube: "bg-red-600",
  pinterest: "bg-red-500",
  snapchat: "bg-yellow-400",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
};

export function CreatePostModal() {
  const { showCreatePost, setShowCreatePost, socialAccounts, contents, currentUser, posts, setPosts } = useERPStore();

  const [socialAccountId, setSocialAccountId] = useState("");
  const [contentId, setContentId] = useState("");
  const [postContent, setPostContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Group social accounts by platform
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, typeof socialAccounts> = {};
    socialAccounts.forEach((account) => {
      if (!groups[account.platform]) {
        groups[account.platform] = [];
      }
      groups[account.platform].push(account);
    });
    return groups;
  }, [socialAccounts]);

  // Get selected social account details
  const selectedAccount = useMemo(() => {
    return socialAccounts.find((a) => a.id === socialAccountId) || null;
  }, [socialAccountId, socialAccounts]);

  // Get character limit for selected platform
  const charLimit = useMemo(() => {
    if (!selectedAccount) return 2200;
    return PLATFORM_CHAR_LIMITS[selectedAccount.platform] || 2200;
  }, [selectedAccount]);

  // Filter contents that are in approve or disseminate stage
  const eligibleContents = useMemo(() => {
    return contents.filter((c) => c.stage === "approve" || c.stage === "disseminate");
  }, [contents]);

  // Get selected content item
  const selectedContent = useMemo(() => {
    return contents.find((c) => c.id === contentId) || null;
  }, [contentId, contents]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!socialAccountId) newErrors.socialAccountId = "Social account is required";
    if (!postContent.trim()) newErrors.postContent = "Post content is required";
    if (postContent.length > charLimit) newErrors.postContent = `Content exceeds ${charLimit} character limit`;
    if (status === "scheduled" && !scheduleDate) newErrors.scheduleDate = "Schedule date is required for scheduled posts";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSocialAccountId("");
    setContentId("");
    setPostContent("");
    setMediaUrls("");
    setScheduleDate(undefined);
    setScheduleTime("12:00");
    setStatus("draft");
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async (submitStatus: PostStatus) => {
    if (!validate()) return;

    if (submitStatus === "scheduled" && !scheduleDate) {
      setErrors((prev) => ({ ...prev, scheduleDate: "Schedule date is required" }));
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = scheduleDate
        ? new Date(
            scheduleDate.getFullYear(),
            scheduleDate.getMonth(),
            scheduleDate.getDate(),
            ...scheduleTime.split(":").map(Number)
          ).toISOString()
        : null;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent.trim(),
          platform: selectedAccount?.platform,
          socialAccountId,
          contentId: contentId || null,
          mediaUrls: mediaUrls.trim() || null,
          status: submitStatus,
          scheduledAt,
          userId: currentUser?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      resetForm();
      setShowCreatePost(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setShowCreatePost(open);
  };

  const charCount = postContent.length;
  const charPercentage = (charCount / charLimit) * 100;
  const isOverLimit = charCount > charLimit;

  return (
    <Dialog open={showCreatePost} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Create Post
          </DialogTitle>
          <DialogDescription>
            Schedule or draft a new social media post. Select a platform and compose your content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-2">
          {/* Form Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Social Account */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Social Account <span className="text-red-500">*</span>
              </Label>
              <Select value={socialAccountId} onValueChange={(v) => {
                setSocialAccountId(v);
                if (errors.socialAccountId) setErrors((prev) => ({ ...prev, socialAccountId: "" }));
              }}>
                <SelectTrigger className={cn("w-full", errors.socialAccountId && "border-red-500")}>
                  <SelectValue placeholder="Select social account" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedAccounts).length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No social accounts available
                    </SelectItem>
                  ) : (
                    Object.entries(groupedAccounts).map(([platform, accounts]) => {
                      const PlatformIcon = PLATFORM_ICONS[platform] || ImageIcon;
                      return (
                        <SelectGroup key={platform}>
                          <SelectLabel className="flex items-center gap-2">
                            <PlatformIcon className="h-3.5 w-3.5" />
                            {PLATFORM_LABELS[platform] || platform}
                          </SelectLabel>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <span className="flex items-center gap-2">
                                @<span>{account.username}</span>
                                {account.displayName && (
                                  <span className="text-muted-foreground">({account.displayName})</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.socialAccountId && (
                <p className="text-xs text-red-500">{errors.socialAccountId}</p>
              )}
            </div>

            {/* Content Item */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Content Item (Optional)</Label>
              <Select value={contentId} onValueChange={setContentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Link to content item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No linked content</SelectItem>
                  {eligibleContents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.title}
                        <span className="text-xs text-muted-foreground ml-1">({c.stage})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only content in Approve or Disseminate stage can be linked
              </p>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="post-content" className="text-sm font-medium">
                  Post Content <span className="text-red-500">*</span>
                </Label>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isOverLimit
                      ? "text-red-500"
                      : charPercentage > 90
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  {charCount}/{charLimit}
                </span>
              </div>
              <Textarea
                id="post-content"
                placeholder="Write your post content here..."
                value={postContent}
                onChange={(e) => {
                  setPostContent(e.target.value);
                  if (errors.postContent) setErrors((prev) => ({ ...prev, postContent: "" }));
                }}
                rows={5}
                className={cn(
                  isOverLimit && "border-red-500 focus-visible:ring-red-500/30",
                  errors.postContent && "border-red-500"
                )}
              />
              {/* Character limit progress bar */}
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isOverLimit
                      ? "bg-red-500"
                      : charPercentage > 90
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
              {errors.postContent && (
                <p className="text-xs text-red-500">{errors.postContent}</p>
              )}
            </div>

            {/* Media URLs */}
            <div className="space-y-2">
              <Label htmlFor="media-urls" className="text-sm font-medium">
                Media URLs
              </Label>
              <Input
                id="media-urls"
                placeholder="Enter media URLs separated by commas..."
                value={mediaUrls}
                onChange={(e) => setMediaUrls(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Add image or video URLs separated by commas</p>
            </div>

            {/* Schedule Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Schedule Date {status === "scheduled" && <span className="text-red-500">*</span>}
                </Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleDate && "text-muted-foreground",
                        errors.scheduleDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleDate ? formatDate(scheduleDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={(date) => {
                        setScheduleDate(date);
                        setDatePickerOpen(false);
                        if (errors.scheduleDate) setErrors((prev) => ({ ...prev, scheduleDate: "" }));
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {errors.scheduleDate && (
                  <p className="text-xs text-red-500">{errors.scheduleDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time" className="text-sm font-medium">
                  Schedule Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-0">
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Label>
              <div className="rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                {/* Preview Header */}
                {selectedAccount && (
                  <div className="p-3 flex items-center gap-2.5 border-b">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                      PLATFORM_COLORS[selectedAccount.platform] || "bg-gray-500"
                    )}>
                      {selectedAccount.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {selectedAccount.displayName || selectedAccount.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{selectedAccount.username}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold text-white px-1.5 py-0.5 rounded",
                      PLATFORM_COLORS[selectedAccount.platform] || "bg-gray-500"
                    )}>
                      {PLATFORM_LABELS[selectedAccount.platform] || selectedAccount.platform}
                    </span>
                  </div>
                )}

                {/* Preview Content */}
                <div className="p-3 space-y-2">
                  {postContent ? (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {postContent}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Your post content will appear here...
                    </p>
                  )}

                  {/* Media preview */}
                  {mediaUrls.trim() && (
                    <div className="rounded-lg bg-muted/50 h-32 flex items-center justify-center border border-dashed">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">
                          {mediaUrls.split(",").filter(Boolean).length} media file(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Linked content indicator */}
                  {selectedContent && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5">
                      <FileText className="h-3 w-3" />
                      <span>Linked: {selectedContent.title}</span>
                    </div>
                  )}

                  {/* Schedule indicator */}
                  {scheduleDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Scheduled: {formatDate(scheduleDate, "MMM d, yyyy")} at {scheduleTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                <div className="px-3 py-2 border-t bg-muted/20">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-medium",
                      status === "scheduled"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {status === "scheduled" ? "Scheduled" : "Draft"}
                    </span>
                    {charCount > 0 && (
                      <span className={cn(
                        isOverLimit ? "text-red-500 font-medium" : ""
                      )}>
                        {charCount}/{charLimit} chars
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* No account selected */}
              {!selectedAccount && (
                <p className="text-xs text-muted-foreground mt-2 text-center italic">
                  Select a social account to see preview
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleSubmit("scheduled")}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Schedule Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
