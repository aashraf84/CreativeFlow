"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type ContentType, type ContentPriority, type ContentStage } from "@/lib/store";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  CalendarIcon,
  Lightbulb,
  PenTool,
  Pencil,
  Eye,
  CheckCircle2,
  Send,
  Image,
  FileText,
  Film,
  Layers,
  Video,
  Palette,
  Type,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "post", label: "Post", icon: FileText },
  { value: "story", label: "Story", icon: Image },
  { value: "reel", label: "Reel", icon: Film },
  { value: "carousel", label: "Carousel", icon: Layers },
  { value: "video", label: "Video", icon: Video },
  { value: "graphic", label: "Graphic", icon: Palette },
  { value: "article", label: "Article", icon: Type },
];

const PRIORITIES: { value: ContentPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "high", label: "High", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
];

const STAGES: { value: ContentStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "design", label: "Design", icon: PenTool },
  { value: "edit", label: "Edit", icon: Pencil },
  { value: "review", label: "Review", icon: Eye },
  { value: "approve", label: "Approve", icon: CheckCircle2 },
  { value: "disseminate", label: "Disseminate", icon: Send },
];

const FORMATS = [
  { value: "square", label: "Square (1:1)" },
  { value: "portrait", label: "Portrait (4:5)" },
  { value: "landscape", label: "Landscape (16:9)" },
  { value: "vertical", label: "Vertical (9:16)" },
];

export function CreateContentModal() {
  const { showCreateContent, setShowCreateContent, teams, campaigns, currentUser, setContents, contents } = useERPStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContentType>("post");
  const [priority, setPriority] = useState<ContentPriority>("medium");
  const [stage, setStage] = useState<ContentStage>("idea");
  const [format, setFormat] = useState("");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [campaignId, setCampaignId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const teamMembers = useMemo(() => {
    if (!teamId) return [];
    const team = teams.find((t) => t.id === teamId);
    if (!team?.members) return [];
    return team.members;
  }, [teamId, teams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("post");
    setPriority("medium");
    setStage("idea");
    setFormat("");
    setTags("");
    setDueDate(undefined);
    setCampaignId("");
    setTeamId("");
    setAssigneeId("");
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type,
          priority,
          stage,
          format: format || null,
          tags: tags.trim() || null,
          dueDate: dueDate ? dueDate.toISOString() : null,
          campaignId: campaignId || null,
          teamId: teamId || null,
          assigneeId: assigneeId || null,
          creatorId: currentUser?.id || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create content");

      const newContent = await res.json();
      setContents([newContent, ...contents]);
      resetForm();
      setShowCreateContent(false);
    } catch (error) {
      console.error("Failed to create content:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setShowCreateContent(open);
  };

  return (
    <Dialog open={showCreateContent} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Create Content
          </DialogTitle>
          <DialogDescription>
            Add a new content item to your pipeline. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="content-title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="content-title"
              placeholder="Enter content title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={cn(errors.title && "border-red-500 focus-visible:ring-red-500/30")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="content-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="content-description"
              placeholder="Describe the content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      <span className="flex items-center gap-2">
                        <ct.icon className="h-3.5 w-3.5" />
                        {ct.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ContentPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn("inline-block h-2 w-2 rounded-full", p.color)} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage & Format Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ContentStage)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <s.icon className="h-3.5 w-3.5" />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="content-tags" className="text-sm font-medium">
              Tags
            </Label>
            <Input
              id="content-tags"
              placeholder="Enter tags separated by commas..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas (e.g., brand, campaign, q1)</p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Due Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? formatDate(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Campaign & Team Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No campaigns available
                    </SelectItem>
                  ) : (
                    campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Team</Label>
              <Select
                value={teamId}
                onValueChange={(v) => {
                  setTeamId(v);
                  setAssigneeId(""); // Reset assignee when team changes
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No teams available
                    </SelectItem>
                  ) : (
                    teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!teamId || teamMembers.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!teamId ? "Select a team first" : teamMembers.length === 0 ? "No members in team" : "Select assignee"} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.userId}>
                    {m.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Content
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
