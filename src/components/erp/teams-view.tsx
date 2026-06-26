"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type Team, type TeamMember } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Plus,
  UserPlus,
  Crown,
  Shield,
  Palette,
  PenTool,
  Film,
  Archive,
  Send,
  LayoutGrid,
  Workflow,
  Sparkles,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
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

const cardHover = {
  hover: {
    y: -2,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

// ── Icon map for team types ─────────────────────────────────────────
const TEAM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  creatives: Sparkles,
  content: PenTool,
  design: Palette,
  edit: Film,
  archive: Archive,
  dissemination: Send,
};

const STAGE_COLORS: Record<string, string> = {
  idea: "bg-emerald-500",
  design: "bg-teal-500",
  edit: "bg-cyan-500",
  review: "bg-amber-500",
  approve: "bg-violet-500",
  disseminate: "bg-pink-500",
  archived: "bg-gray-400",
};

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  design: "Design",
  edit: "Edit",
  review: "Review",
  approve: "Approve",
  disseminate: "Disseminate",
  archived: "Archived",
};

// ── Helpers ─────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "lead") return "default";
  if (role === "senior") return "secondary";
  return "outline";
}

function getRoleIcon(role: string) {
  if (role === "lead") return <Crown className="h-3 w-3" />;
  if (role === "senior") return <Shield className="h-3 w-3" />;
  return null;
}

// ── Main Component ──────────────────────────────────────────────────
export function TeamsView() {
  const { teams, contents } = useERPStore();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Compute workload per team
  const teamWorkloads = useMemo(() => {
    const workloads: Record<string, Record<string, number>> = {};
    teams.forEach((team) => {
      const stageCounts: Record<string, number> = {
        idea: 0,
        design: 0,
        edit: 0,
        review: 0,
        approve: 0,
        disseminate: 0,
        archived: 0,
      };
      contents
        .filter((c) => c.teamId === team.id)
        .forEach((c) => {
          if (stageCounts[c.stage] !== undefined) {
            stageCounts[c.stage]++;
          }
        });
      workloads[team.id] = stageCounts;
    });
    return workloads;
  }, [teams, contents]);

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const selectTeam = (teamId: string) => {
    setSelectedTeamId(selectedTeamId === teamId ? null : teamId);
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Total content per team
  const teamContentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teams.forEach((team) => {
      counts[team.id] = contents.filter((c) => c.teamId === team.id).length;
    });
    return counts;
  }, [teams, contents]);

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const totalContent = contents.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Team Management</h2>
            <p className="text-sm text-muted-foreground">Manage teams, members, and workload</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Team
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{teams.length}</p>
            <p className="text-xs text-muted-foreground">Active Teams</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{totalContent}</p>
            <p className="text-xs text-muted-foreground">Content Items</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {teams.length > 0 ? Math.round(totalMembers / teams.length) : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Team Size</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Team Cards Grid */}
        <motion.div variants={itemVariants} className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team, idx) => {
              const Icon = TEAM_ICONS[team.type] || Workflow;
              const isExpanded = expandedTeamId === team.id;
              const isSelected = selectedTeamId === team.id;
              const workload = teamWorkloads[team.id] || {};
              const totalItems = Object.values(workload).reduce((a, b) => a + b, 0);
              const activeItems = totalItems - (workload.archived || 0);

              return (
                <motion.div
                  key={team.id}
                  variants={itemVariants}
                  whileHover="hover"
                  custom={idx}
                >
                  <motion.div variants={cardHover}>
                    <Card
                      className={`cursor-pointer transition-colors overflow-hidden ${
                        isSelected ? "ring-2 ring-emerald-500 bg-emerald-500/[0.02]" : "hover:border-emerald-500/30"
                      }`}
                      style={{ borderLeftWidth: "4px", borderLeftColor: team.color }}
                    >
                      {/* Team Header */}
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${team.color}18` }}
                            >
                              <Icon className="h-4 w-4" style={{ color: team.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold">{team.name}</CardTitle>
                              <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{team.type} Team</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {team.members.length} {team.members.length === 1 ? "member" : "members"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(team.id);
                              }}
                            >
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </motion.div>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 pt-0">
                        {/* Description */}
                        {team.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{team.description}</p>
                        )}

                        {/* Workload Progress Bars */}
                        <div className="space-y-1.5 mb-3">
                          {activeItems > 0 ? (
                            Object.entries(workload)
                              .filter(([stage]) => stage !== "archived")
                              .filter(([, count]) => count > 0)
                              .map(([stage, count]) => (
                                <div key={stage} className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-16 capitalize truncate">
                                    {STAGE_LABELS[stage] || stage}
                                  </span>
                                  <div className="flex-1">
                                    <Progress
                                      value={totalItems > 0 ? (count / totalItems) * 100 : 0}
                                      className="h-1.5"
                                    />
                                  </div>
                                  <span className="text-[10px] font-semibold text-muted-foreground w-4 text-right">
                                    {count}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <p className="text-[10px] text-muted-foreground/50">No content assigned</p>
                          )}
                        </div>

                        {/* Member Avatars (collapsed) */}
                        <div className="flex items-center -space-x-2">
                          {team.members.slice(0, 5).map((member) => (
                            <TooltipProvider key={member.id} delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-7 w-7 border-2 border-card">
                                    <AvatarImage src={member.user.avatar || undefined} />
                                    <AvatarFallback className="text-[9px] font-bold bg-muted">
                                      {getInitials(member.user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p className="text-xs font-medium">{member.user.name}</p>
                                  <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {team.members.length > 5 && (
                            <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                              <span className="text-[9px] font-bold text-muted-foreground">
                                +{team.members.length - 5}
                              </span>
                            </div>
                          )}
                          <div className="ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectTeam(team.id);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Member List */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Separator className="my-3" />
                              <div className="space-y-2">
                                {team.members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors"
                                  >
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={member.user.avatar || undefined} />
                                      <AvatarFallback className="text-[9px] font-bold bg-muted">
                                        {getInitials(member.user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{member.user.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{member.user.email}</p>
                                    </div>
                                    <Badge
                                      variant={getRoleBadgeVariant(member.role)}
                                      className="text-[9px] h-5 px-1.5 gap-0.5"
                                    >
                                      {getRoleIcon(member.role)}
                                      {member.role}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Add Team Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-dashed border-2 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-colors cursor-pointer h-full min-h-[200px]">
                <CardContent className="flex flex-col items-center justify-center h-full p-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Add New Team</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 text-center">Create a new team to manage content workflow</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Detail Panel */}
        {selectedTeam && (
          <motion.div
            variants={itemVariants}
            className="w-full lg:w-80 xl:w-96"
          >
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${selectedTeam.color}18` }}
                  >
                    {(() => {
                      const Icon = TEAM_ICONS[selectedTeam.type] || Workflow;
                      return <Icon className="h-5 w-5" style={{ color: selectedTeam.color }} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-bold">{selectedTeam.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">{selectedTeam.type} Team</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSelectedTeamId(null)}
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTeam.description && (
                  <p className="text-xs text-muted-foreground mb-4">{selectedTeam.description}</p>
                )}

                {/* Members Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Members ({selectedTeam.members.length})
                    </h4>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                      <UserPlus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[250px]">
                    <div className="space-y-1.5">
                      {selectedTeam.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.avatar || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-muted">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{member.user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{member.user.email}</p>
                          </div>
                          <Badge
                            variant={getRoleBadgeVariant(member.role)}
                            className="text-[9px] h-5 px-1.5 gap-0.5 shrink-0"
                          >
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="my-4" />

                {/* Content by Stage */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Content by Stage
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(teamWorkloads[selectedTeam.id] || {})
                      .filter(([, count]) => count > 0)
                      .map(([stage, count]) => {
                        const total = Object.values(teamWorkloads[selectedTeam.id] || {}).reduce((a, b) => a + b, 0);
                        return (
                          <div key={stage} className="flex items-center gap-2.5">
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${STAGE_COLORS[stage] || "bg-gray-400"}`} />
                            <span className="text-xs text-muted-foreground capitalize flex-1">
                              {STAGE_LABELS[stage] || stage}
                            </span>
                            <div className="w-24">
                              <Progress
                                value={total > 0 ? (count / total) * 100 : 0}
                                className="h-1.5"
                              />
                            </div>
                            <span className="text-xs font-bold w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    {Object.values(teamWorkloads[selectedTeam.id] || {}).every((v) => v === 0) && (
                      <p className="text-xs text-muted-foreground/50 text-center py-4">No content assigned to this team</p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{teamContentCounts[selectedTeam.id] || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Total Items</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{selectedTeam.members.length}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No teams yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first team to get started</p>
              <Button className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
