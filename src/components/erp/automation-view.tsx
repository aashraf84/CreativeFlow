"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type AutomationRule } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow,
  Plus,
  Zap,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Bell,
  Send,
  FolderInput,
  UserPlus,
  Clock,
  Gauge,
  Sparkles,
  Archive,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ── Trigger types ──────────────────────────────────────────────────
const TRIGGER_TYPES = [
  { value: "stage_change", label: "Stage Change", icon: ArrowRight, color: "#10b981" },
  { value: "content_created", label: "Content Created", icon: Plus, color: "#14b8a6" },
  { value: "scheduled_time", label: "Scheduled Time", icon: Clock, color: "#06b6d4" },
  { value: "engagement_threshold", label: "Engagement Threshold", icon: Gauge, color: "#0d9488" },
] as const;

// ── Action types ──────────────────────────────────────────────────
const ACTION_TYPES = [
  { value: "move_to_stage", label: "Move to Stage", icon: FolderInput, color: "#10b981" },
  { value: "assign_to_team", label: "Assign to Team", icon: UserPlus, color: "#14b8a6" },
  { value: "send_notification", label: "Send Notification", icon: Bell, color: "#06b6d4" },
  { value: "auto_publish", label: "Auto-Publish", icon: Send, color: "#0d9488" },
] as const;

// ── Automation templates ──────────────────────────────────────────
const TEMPLATES = [
  {
    name: "Auto-assign Design stage to Design team",
    description: "When content enters the Design stage, automatically assign it to the Design team.",
    trigger: "stage_change",
    conditions: JSON.stringify([{ key: "stage", operator: "equals", value: "design" }]),
    actions: JSON.stringify([{ type: "assign_to_team", team: "Design" }]),
  },
  {
    name: "Notify on urgent content creation",
    description: "Send a notification whenever content with urgent priority is created.",
    trigger: "content_created",
    conditions: JSON.stringify([{ key: "priority", operator: "equals", value: "urgent" }]),
    actions: JSON.stringify([{ type: "send_notification", message: "Urgent content created" }]),
  },
  {
    name: "Auto-schedule approved content",
    description: "When content reaches the Approve stage, automatically schedule it for publishing.",
    trigger: "stage_change",
    conditions: JSON.stringify([{ key: "stage", operator: "equals", value: "approve" }]),
    actions: JSON.stringify([{ type: "auto_publish" }]),
  },
  {
    name: "Move to Archive after 30 days published",
    description: "Automatically archive content that has been published for more than 30 days.",
    trigger: "scheduled_time",
    conditions: JSON.stringify([{ key: "days_published", operator: "greater_than", value: "30" }]),
    actions: JSON.stringify([{ type: "move_to_stage", stage: "archived" }]),
  },
];

// ── Condition / Action row types ──────────────────────────────────
interface ConditionRow {
  key: string;
  operator: string;
  value: string;
}

interface ActionRow {
  type: string;
  [key: string]: string;
}

// ── Form state ──────────────────────────────────────────────────
interface RuleForm {
  name: string;
  description: string;
  trigger: string;
  conditions: ConditionRow[];
  actions: ActionRow[];
  isActive: boolean;
}

const emptyForm: RuleForm = {
  name: "",
  description: "",
  trigger: "stage_change",
  conditions: [{ key: "", operator: "equals", value: "" }],
  actions: [{ type: "move_to_stage" }],
  isActive: true,
};

export function AutomationView() {
  const { automations, setAutomations } = useERPStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = useMemo(() => automations.filter((a) => a.isActive).length, [automations]);

  // ── Parse conditions / actions for display ──────────────────────────
  function parseJSON<T>(str: string | null, fallback: T[]): T[] {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  // ── Create / Update ──────────────────────────────────────────────
  function handleSave() {
    if (!form.name.trim()) return;

    const rule: AutomationRule = {
      id: editingId || `auto-${Date.now()}`,
      name: form.name,
      description: form.description || null,
      trigger: form.trigger,
      conditions: JSON.stringify(form.conditions),
      actions: JSON.stringify(form.actions),
      isActive: form.isActive,
    };

    if (editingId) {
      setAutomations(automations.map((a) => (a.id === editingId ? rule : a)));
    } else {
      setAutomations([...automations, rule]);
    }
    closeForm();
  }

  // ── Edit ──────────────────────────────────────────────────────────
  function handleEdit(rule: AutomationRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      description: rule.description || "",
      trigger: rule.trigger,
      conditions: parseJSON<ConditionRow>(rule.conditions, [{ key: "", operator: "equals", value: "" }]),
      actions: parseJSON<ActionRow>(rule.actions, [{ type: "move_to_stage" }]),
      isActive: rule.isActive,
    });
    setShowForm(true);
  }

  // ── Delete ──────────────────────────────────────────────────────
  function handleDelete() {
    if (deleteId) {
      setAutomations(automations.filter((a) => a.id !== deleteId));
      setDeleteId(null);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────
  function handleToggle(ruleId: string, active: boolean) {
    setAutomations(automations.map((a) => (a.id === ruleId ? { ...a, isActive: active } : a)));
  }

  // ── Use template ──────────────────────────────────────────────
  function handleUseTemplate(template: typeof TEMPLATES[0]) {
    setEditingId(null);
    setForm({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: parseJSON<ConditionRow>(template.conditions, [{ key: "", operator: "equals", value: "" }]),
      actions: parseJSON<ActionRow>(template.actions, [{ type: "move_to_stage" }]),
      isActive: true,
    });
    setShowForm(true);
  }

  // ── Close form ──────────────────────────────────────────────
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // ── Add / remove conditions ──────────────────────────────────
  function addCondition() {
    setForm({ ...form, conditions: [...form.conditions, { key: "", operator: "equals", value: "" }] });
  }
  function removeCondition(index: number) {
    setForm({ ...form, conditions: form.conditions.filter((_, i) => i !== index) });
  }
  function updateCondition(index: number, field: keyof ConditionRow, value: string) {
    const updated = [...form.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, conditions: updated });
  }

  // ── Add / remove actions ─────────────────────────────────────
  function addAction() {
    setForm({ ...form, actions: [...form.actions, { type: "send_notification" }] });
  }
  function removeAction(index: number) {
    setForm({ ...form, actions: form.actions.filter((_, i) => i !== index) });
  }
  function updateAction(index: number, field: string, value: string) {
    const updated = [...form.actions];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, actions: updated });
  }

  // ── Get trigger badge info ────────────────────────────────────
  function getTriggerInfo(triggerValue: string) {
    return TRIGGER_TYPES.find((t) => t.value === triggerValue) || TRIGGER_TYPES[0];
  }

  // ── Get action badge info ─────────────────────────────────────
  function getActionInfo(actionValue: string) {
    return ACTION_TYPES.find((a) => a.value === actionValue) || ACTION_TYPES[0];
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-6 w-6 text-emerald-500" />
            Automation Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workflows and automation triggers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{activeCount} Active</span>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Rule
          </Button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Rules List */}
        {automations.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-16 text-center">
                <Workflow className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No automation rules yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Create your first rule or use a template below</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {automations.map((rule, index) => {
                const trigger = getTriggerInfo(rule.trigger);
                const actions = parseJSON<ActionRow>(rule.actions, []);
                const conditions = parseJSON<ConditionRow>(rule.conditions, []);
                const isExpanded = expandedId === rule.id;
                const TriggerIcon = trigger.icon;

                return (
                  <motion.div
                    key={rule.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "transition-all duration-200",
                      !rule.isActive && "opacity-60",
                    )}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-base truncate">{rule.name}</h3>
                              {rule.isActive ? (
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Trigger badge */}
                              <Badge variant="outline" className="gap-1.5 text-xs" style={{ borderColor: trigger.color, color: trigger.color }}>
                                <TriggerIcon className="h-3 w-3" />
                                {trigger.label}
                              </Badge>
                              {/* Action badges */}
                              {actions.map((action, i) => {
                                const actionInfo = getActionInfo(action.type);
                                const ActionIcon = actionInfo.icon;
                                return (
                                  <Badge key={i} variant="outline" className="gap-1.5 text-xs" style={{ borderColor: actionInfo.color, color: actionInfo.color }}>
                                    <ActionIcon className="h-3 w-3" />
                                    {actionInfo.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                              onClick={() => handleEdit(rule)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteId(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Separator className="my-4" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Conditions */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Conditions</h4>
                                  {conditions.length > 0 && conditions.some((c) => c.key) ? (
                                    <div className="space-y-1.5">
                                      {conditions.map((cond, i) => (
                                        cond.key ? (
                                          <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
                                            <code className="font-mono text-emerald-600 dark:text-emerald-400">{cond.key}</code>
                                            <span className="text-muted-foreground">{cond.operator}</span>
                                            <code className="font-mono text-teal-600 dark:text-teal-400">{cond.value}</code>
                                          </div>
                                        ) : null
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No conditions defined</p>
                                  )}
                                </div>
                                {/* Actions detail */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions Detail</h4>
                                  <div className="space-y-1.5">
                                    {actions.map((action, i) => {
                                      const actionInfo = getActionInfo(action.type);
                                      const ActionIcon = actionInfo.icon;
                                      return (
                                        <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
                                          <ActionIcon className="h-3.5 w-3.5" style={{ color: actionInfo.color }} />
                                          <span>{actionInfo.label}</span>
                                          {action.stage && <code className="font-mono text-emerald-600 dark:text-emerald-400 ml-1">→ {action.stage}</code>}
                                          {action.team && <code className="font-mono text-teal-600 dark:text-teal-400 ml-1">→ {action.team}</code>}
                                          {action.message && <code className="font-mono text-cyan-600 dark:text-cyan-400 ml-1">"{action.message}"</code>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Automation Templates */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Quick Templates
              </CardTitle>
              <CardDescription>Get started with pre-built automation rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEMPLATES.map((template, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-tight">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-emerald-500" />
              {editingId ? "Edit Rule" : "Create Rule"}
            </DialogTitle>
            <DialogDescription>
              Define triggers, conditions, and actions for your automation
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5 py-2">
              {/* Rule name */}
              <div className="space-y-2">
                <Label htmlFor="rule-name" className="text-sm font-medium">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., Auto-assign Design stage"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="rule-desc" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="rule-desc"
                  placeholder="What does this automation do?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Trigger type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trigger Type</Label>
                <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" style={{ color: t.color }} />
                            {t.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Conditions builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Conditions</Label>
                  <Button variant="ghost" size="sm" onClick={addCondition} className="text-emerald-600 h-7">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {form.conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Key (e.g., stage)"
                      value={cond.key}
                      onChange={(e) => updateCondition(i, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Select value={cond.operator} onValueChange={(v) => updateCondition(i, "operator", v)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">not equals</SelectItem>
                        <SelectItem value="greater_than">greater than</SelectItem>
                        <SelectItem value="less_than">less than</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Value"
                      value={cond.value}
                      onChange={(e) => updateCondition(i, "value", e.target.value)}
                      className="flex-1"
                    />
                    {form.conditions.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCondition(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Actions builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Actions</Label>
                  <Button variant="ghost" size="sm" onClick={addAction} className="text-emerald-600 h-7">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {form.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 space-y-2">
                      <Select value={action.type} onValueChange={(v) => updateAction(i, "type", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((a) => {
                            const Icon = a.icon;
                            return (
                              <SelectItem key={a.value} value={a.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5" style={{ color: a.color }} />
                                  {a.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {action.type === "move_to_stage" && (
                        <Input
                          placeholder="Target stage (e.g., archived)"
                          value={action.stage || ""}
                          onChange={(e) => updateAction(i, "stage", e.target.value)}
                        />
                      )}
                      {action.type === "assign_to_team" && (
                        <Input
                          placeholder="Team name (e.g., Design)"
                          value={action.team || ""}
                          onChange={(e) => updateAction(i, "team", e.target.value)}
                        />
                      )}
                      {action.type === "send_notification" && (
                        <Input
                          placeholder="Notification message"
                          value={action.message || ""}
                          onChange={(e) => updateAction(i, "message", e.target.value)}
                        />
                      )}
                    </div>
                    {form.actions.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1" onClick={() => removeAction(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Active</Label>
                  <p className="text-xs text-muted-foreground">Enable this rule to run automatically</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!form.name.trim()}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {editingId ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this automation rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
