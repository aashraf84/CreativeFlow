"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useERPStore, type CalendarEvent } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Send,
  Flag,
  Clock,
  Eye,
  Sparkles,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ── Color maps ──────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  idea: "#10b981",
  design: "#14b8a6",
  edit: "#06b6d4",
  review: "#f59e0b",
  approve: "#8b5cf6",
  disseminate: "#ec4899",
  archived: "#6b7280",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  snapchat: "#FFFC00",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  content: "#10b981",
  post: "#14b8a6",
  campaign: "#f59e0b",
};

const EVENT_TYPE_BG: Record<string, string> = {
  content: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  post: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  campaign: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ─────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(dateKey: string, year: number, month: number, day: number): boolean {
  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return dateKey === key;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

// ── Main Component ──────────────────────────────────────────────────
export function CalendarView() {
  const { calendarEvents, contents, posts, campaigns } = useERPStore();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [showDetail, setShowDetail] = useState(false);

  // Navigate months
  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setShowDetail(false);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setShowDetail(false);
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setShowDetail(true);
  }, [today]);

  // Build extended calendar events from store data
  const allEvents = useMemo(() => {
    const events: (CalendarEvent & { extra?: Record<string, unknown> })[] = [...calendarEvents];

    // Add content due dates
    contents.forEach((c) => {
      if (c.dueDate) {
        const date = new Date(c.dueDate);
        events.push({
          id: `content-due-${c.id}`,
          title: c.title,
          date: formatDateKey(date),
          type: "content",
          status: c.stage,
          color: STAGE_COLORS[c.stage] || "#10b981",
        });
      }
    });

    // Add scheduled posts
    posts.forEach((p) => {
      if (p.scheduledAt) {
        const date = new Date(p.scheduledAt);
        events.push({
          id: `post-sched-${p.id}`,
          title: p.content?.substring(0, 40) || "Post",
          date: formatDateKey(date),
          type: "post",
          status: p.status,
          platform: p.platform,
          color: PLATFORM_COLORS[p.platform] || "#14b8a6",
        });
      }
    });

    // Add campaign milestones
    campaigns.forEach((c) => {
      if (c.startDate) {
        const date = new Date(c.startDate);
        events.push({
          id: `campaign-start-${c.id}`,
          title: `${c.name} Starts`,
          date: formatDateKey(date),
          type: "campaign",
          status: "started",
          color: "#f59e0b",
        });
      }
      if (c.endDate) {
        const date = new Date(c.endDate);
        events.push({
          id: `campaign-end-${c.id}`,
          title: `${c.name} Ends`,
          date: formatDateKey(date),
          type: "campaign",
          status: "ending",
          color: "#ef4444",
        });
      }
    });

    return events;
  }, [calendarEvents, contents, posts, campaigns]);

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [allEvents]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    return eventsByDate[key] || [];
  }, [selectedDay, currentYear, currentMonth, eventsByDate]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let contentDue = 0;
    let postsScheduled = 0;
    let campaignsEnding = 0;

    allEvents.forEach((e) => {
      const eventDate = new Date(e.date);
      if (eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth) {
        if (e.type === "content") contentDue++;
        else if (e.type === "post") postsScheduled++;
        else if (e.type === "campaign" && e.status === "ending") campaignsEnding++;
      }
    });

    return { contentDue, postsScheduled, campaignsEnding };
  }, [allEvents, currentYear, currentMonth]);

  // Calendar grid data
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );

    const cells: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true, isToday: isToday(currentYear, currentMonth, d) });
    }

    // Next month filler
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isCurrentMonth: false, isToday: false });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" });

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setShowDetail(true);
  };

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
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Content Calendar</h2>
            <p className="text-sm text-muted-foreground">Plan and track your content schedule</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs font-medium">
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">{monthName}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Mini Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.contentDue}</p>
              <p className="text-xs text-muted-foreground">Content Due This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.postsScheduled}</p>
              <p className="text-xs text-muted-foreground">Posts Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.campaignsEnding}</p>
              <p className="text-xs text-muted-foreground">Campaigns Ending</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Calendar Grid */}
        <motion.div variants={itemVariants} className="flex-1">
          <Card>
            <CardContent className="p-3 md:p-4">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
                {calendarGrid.map((cell, idx) => {
                  const key = cell.isCurrentMonth
                    ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`
                    : "";
                  const dayEvents = key ? (eventsByDate[key] || []) : [];
                  const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
                  const isCurrentDay = cell.isToday;

                  return (
                    <div
                      key={idx}
                      onClick={() => cell.isCurrentMonth && handleDayClick(cell.day)}
                      className={`
                        relative min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 transition-colors cursor-pointer
                        ${cell.isCurrentMonth ? "bg-card hover:bg-accent/50" : "bg-muted/30"}
                        ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/5" : ""}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`
                            text-xs font-medium inline-flex items-center justify-center
                            ${!cell.isCurrentMonth ? "text-muted-foreground/40" : ""}
                            ${isCurrentDay ? "h-6 w-6 rounded-full bg-emerald-500 text-white font-bold" : "text-foreground"}
                            ${isSelected && !isCurrentDay ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}
                          `}
                        >
                          {cell.day}
                        </span>
                        {dayEvents.length > 0 && cell.isCurrentMonth && (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event indicators */}
                      {cell.isCurrentMonth && (
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <TooltipProvider key={event.id} delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="hidden md:block text-[10px] leading-tight font-medium truncate rounded px-1 py-0.5"
                                    style={{
                                      backgroundColor: `${event.color}18`,
                                      color: event.color,
                                    }}
                                  >
                                    {event.title}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                  <p className="font-medium text-xs">{event.title}</p>
                                  <p className="text-[10px] text-muted-foreground capitalize">{event.type} • {event.status}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}

                          {/* Dots for mobile / overflow */}
                          <div className="flex gap-0.5 flex-wrap md:hidden">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: event.color }}
                              />
                            ))}
                          </div>
                          {dayEvents.length > 3 && (
                            <div className="text-[9px] text-muted-foreground font-medium hidden md:block">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Sidebar */}
        <motion.div variants={itemVariants} className="w-full lg:w-80 xl:w-96">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-500" />
                {selectedDay
                  ? `${new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}`
                  : "Select a Day"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showDetail && selectedDay ? (
                  <motion.div
                    key={`${currentYear}-${currentMonth}-${selectedDay}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {selectedDayEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No events scheduled</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">This day is clear</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[500px]">
                        <div className="space-y-2">
                          {selectedDayEvents.map((event, idx) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group rounded-lg border p-3 hover:shadow-sm transition-shadow"
                              style={{ borderLeftWidth: "3px", borderLeftColor: event.color }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{event.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] px-1.5 py-0 h-5 ${EVENT_TYPE_BG[event.type] || ""}`}
                                    >
                                      {event.type}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground capitalize">
                                      {event.status}
                                    </span>
                                    {event.platform && (
                                      <span
                                        className="text-[10px] font-semibold capitalize"
                                        style={{ color: PLATFORM_COLORS[event.platform] || "#6b7280" }}
                                      >
                                        {event.platform}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                                  style={{ backgroundColor: event.color }}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Click a day to view details</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Content Due</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                <span className="text-xs text-muted-foreground">Scheduled Post</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Campaign Milestone</span>
              </div>
              <Separator className="my-2" />
              <p className="text-[10px] text-muted-foreground/60">Colors reflect content stage or platform</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(STAGE_COLORS).map(([stage, color]) => (
                  <div key={stage} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-muted-foreground capitalize">{stage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
