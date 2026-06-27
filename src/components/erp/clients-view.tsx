"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type Client, type Campaign } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  TrendingUp,
  Calendar,
  DollarSign,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  MoreVertical,
  ChevronRight,
  Users,
  Target,
  BarChart3,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  prospect: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const campaignStatusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
};

const clientInitials = (name: string) => name.split(/[\s-&]+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

const industryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Technology: TrendingUp,
  Fashion: Sparkles,
  Food: Target,
  Automotive: Briefcase,
  Health: BarChart3,
};

export function ClientsView() {
  const { clients, campaigns } = useERPStore();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const clientCampaigns = useMemo(() => {
    if (!selectedClient) return [];
    return campaigns.filter(c => c.client?.id === selectedClient.id);
  }, [selectedClient, campaigns]);

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  return (
    <motion.div className="p-4 lg:p-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Clients & Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your clients and their campaigns</p>
        </div>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Clients", value: totalClients, icon: Building2, gradient: "from-emerald-500 to-emerald-600" },
          { label: "Active Clients", value: activeClients, icon: Users, gradient: "from-teal-500 to-teal-600" },
          { label: "Active Campaigns", value: activeCampaigns, icon: Target, gradient: "from-cyan-500 to-cyan-600" },
          { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, gradient: "from-emerald-600 to-teal-600" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={itemVariants}>
              <Card className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", kpi.gradient)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clients List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search clients..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All ({clients.length})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Active ({activeClients})</TabsTrigger>
              <TabsTrigger value="prospect" className="text-xs">Prospects</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-3 space-y-2">
              {filteredClients.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  campaigns={campaigns.filter(c => c.client?.id === client.id)}
                  isSelected={selectedClient?.id === client.id}
                  onSelect={() => setSelectedClient(client)}
                />
              ))}
              {filteredClients.length === 0 && (
                <Card className="shadow-sm"><CardContent className="py-8 text-center text-muted-foreground text-sm">No clients found</CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-3 space-y-2">
              {filteredClients.filter(c => c.status === "active").map(client => (
                <ClientCard key={client.id} client={client} campaigns={campaigns.filter(c => c.client?.id === client.id)} isSelected={selectedClient?.id === client.id} onSelect={() => setSelectedClient(client)} />
              ))}
            </TabsContent>

            <TabsContent value="prospect" className="mt-3 space-y-2">
              {filteredClients.filter(c => c.status === "prospect").map(client => (
                <ClientCard key={client.id} client={client} campaigns={campaigns.filter(c => c.client?.id === client.id)} isSelected={selectedClient?.id === client.id} onSelect={() => setSelectedClient(client)} />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Client/Campaign Detail Panel */}
        <div className="space-y-3">
          {selectedClient ? (
            <>
              {/* Client Detail */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-sm border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold text-sm">
                          {clientInitials(selectedClient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{selectedClient.name}</CardTitle>
                        <Badge className={cn("mt-1 text-[10px]", statusColors[selectedClient.status] || statusColors.active)}>
                          {selectedClient.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {selectedClient.industry && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{selectedClient.industry}</span>
                      </div>
                    )}
                    {selectedClient.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href="#" className="text-emerald-600 hover:underline truncate">{selectedClient.website}</a>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Client Campaigns */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold px-1">Campaigns ({clientCampaigns.length})</h3>
                {clientCampaigns.map(campaign => (
                  <motion.div key={campaign.id} variants={itemVariants}>
                    <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate">{campaign.name}</h4>
                            {campaign.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{campaign.description}</p>
                            )}
                          </div>
                          <Badge className={cn("ml-2 text-[10px] shrink-0", campaignStatusColors[campaign.status] || campaignStatusColors.draft)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          {campaign.budget && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${campaign.budget.toLocaleString()}</span>
                            </div>
                          )}
                          {campaign.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(campaign.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </div>
                          )}
                        </div>
                        {campaign.budget && (
                          <div className="mt-2">
                            <Progress value={campaign.status === "completed" ? 100 : campaign.status === "active" ? 60 : 20} className="h-1.5" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {clientCampaigns.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No campaigns yet</p>
                )}
              </div>
            </>
          ) : (
            <Card className="shadow-sm border-border/60">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Select a client</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Click a client to view details and campaigns</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* All Campaigns Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">All Campaigns</h3>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Campaign
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{campaign.name}</h4>
                    <p className="text-xs text-muted-foreground">{campaign.client?.name || "No client"}</p>
                  </div>
                  <Badge className={cn("ml-2 text-[10px] shrink-0", campaignStatusColors[campaign.status] || campaignStatusColors.draft)}>
                    {campaign.status}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{campaign.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {campaign.budget && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${(campaign.budget / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                    {campaign.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(campaign.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ClientCard({
  client,
  campaigns,
  isSelected,
  onSelect,
}: {
  client: Client;
  campaigns: Campaign[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          "shadow-sm cursor-pointer transition-all hover:shadow-md",
          isSelected ? "border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30" : "border-border/60"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold text-xs">
                {clientInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold truncate">{client.name}</h4>
                <Badge className={cn("text-[9px] px-1.5 py-0", statusColors[client.status] || statusColors.active)}>
                  {client.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {client.industry && <span>{client.industry}</span>}
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                </span>
                {activeCampaigns > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {activeCampaigns} active
                  </span>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => e.stopPropagation()}>Edit Client</DropdownMenuItem>
                <DropdownMenuItem onClick={e => e.stopPropagation()}>View Campaigns</DropdownMenuItem>
                <DropdownMenuItem onClick={e => e.stopPropagation()} className="text-rose-600">Deactivate</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
