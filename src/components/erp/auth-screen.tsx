"use client"

import React, { useState, useEffect } from "react"
import { useERPStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, KeyRound, LogIn, Sparkles, Shield, Zap, Lock, ArrowRight,
  Loader2, User, Building2, TrendingUp, Globe, CheckCircle2, Star,
} from "lucide-react"

// Auto-rotating hero stats
const HERO_STATS = [
  { value: "26+", label: "Modules" },
  { value: "10K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "Real-time", label: "Analytics" },
]

// Floating feature badges
const FEATURES = [
  { icon: Shield, title: "Enterprise Security", desc: "Serial key device authentication", color: "#34c759" },
  { icon: Building2, title: "Multi-Tenant", desc: "Neon PostgreSQL serverless", color: "#0a84ff" },
  { icon: TrendingUp, title: "Real-time Analytics", desc: "Live dashboards & reports", color: "#ff9500" },
  { icon: Globe, title: "Web Search Integration", desc: "Search influencers on the internet", color: "#af52de" },
]

export function AuthScreen() {
  const { authState, setAuthState, setCurrentUser, setIsViewOnly, setDeviceRegistered } = useERPStore()

  const [serialKey, setSerialKey] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statIndex, setStatIndex] = useState(0)
  const [deviceId] = useState(() => {
    if (typeof window === "undefined") return ""
    const id = localStorage.getItem("erp_device_id") || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("erp_device_id", id)
    return id
  })

  // Auto-rotate hero stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStatIndex(prev => (prev + 1) % HERO_STATS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const registered = localStorage.getItem("erp_device_registered") === "true"
    const session = localStorage.getItem("erp_session")

    if (session) {
      try {
        const sessionData = JSON.parse(session)
        if (sessionData.user) {
          setCurrentUser(sessionData.user)
          setIsViewOnly(sessionData.user.isDemo || false)
          setAuthState("authenticated")
          return
        }
      } catch { /* ignore */ }
    }

    if (registered) {
      setDeviceRegistered(true)
      setAuthState("login")
    } else {
      setAuthState("serial-key")
    }
  }, [])

  const handleSerialKeySubmit = async () => {
    setError("")
    if (!serialKey.trim()) { setError("Please enter your serial key"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/serial-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialKey: serialKey.trim(), deviceId, userAgent: navigator.userAgent }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Invalid serial key"); setLoading(false); return }
      localStorage.setItem("erp_device_registered", "true")
      localStorage.setItem("erp_serial_key", serialKey.trim())
      setDeviceRegistered(true)
      setAuthState("login")
    } catch {
      setError("Server connection failed. Please try again.")
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setError("")
    if (!email.trim() || !password.trim()) { setError("Please enter email and password"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, deviceId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return }
      const userData = { id: data.user.id, email: data.user.email, name: data.user.name, avatar: data.user.avatar, role: data.user.role, organizationId: data.user.organizationId }
      setCurrentUser(userData)
      setIsViewOnly(false)
      localStorage.setItem("erp_session", JSON.stringify({ user: userData, isDemo: false }))
      setAuthState("authenticated")
    } catch {
      setError("Server connection failed. Please try again.")
    }
    setLoading(false)
  }

  const handleDemoLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Demo login failed"); setLoading(false); return }
      const userData = { id: data.user.id, email: data.user.email, name: data.user.name, avatar: data.user.avatar, role: "demo", organizationId: data.user.organizationId }
      setCurrentUser(userData)
      setIsViewOnly(true)
      localStorage.setItem("erp_session", JSON.stringify({ user: userData, isDemo: true }))
      localStorage.setItem("erp_device_registered", "true")
      setDeviceRegistered(true)
      setAuthState("authenticated")
    } catch {
      setError("Server connection failed. Please try again.")
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action()
  }

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-black text-white relative overflow-hidden">
      {/* LEFT PANEL — Hero / Branding (macOS lock screen style) */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Solid colored gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-600/25 vortex-float" />
          <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-teal-600/20 vortex-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-purple-600/15 vortex-float" style={{ animationDelay: "2s" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        {/* Top: Logo + Hero Text */}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3 mb-12">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30">
              <Zap className="h-8 w-8 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">VortexERP</h1>
              <p className="text-xs text-white/50">Agency Operating System</p>
            </div>
          </motion.div>

          {/* Hero headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <h2 className="text-5xl font-bold leading-tight mb-4">
              Where Creative<br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Agencies Thrive</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md mb-8">
              The all-in-one platform uniting creative workflows, finance, human resources, inventory, and analytics — engineered for scale.
            </p>
          </motion.div>

          {/* Feature badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-2 gap-3 max-w-md">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.06] border border-white/10"
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${f.color}20` }}>
                  <f.icon className="h-4 w-4" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{f.title}</p>
                  <p className="text-[10px] text-white/50">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom: Auto-rotating stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="relative z-10 flex items-end gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={statIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-4xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">{HERO_STATS[statIndex].value}</p>
              <p className="text-xs text-white/50">{HERO_STATS[statIndex].label}</p>
            </motion.div>
          </AnimatePresence>
          {/* Progress dots */}
          <div className="flex gap-1.5 pb-2">
            {HERO_STATS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStatIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === statIndex ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL — Auth Form (macOS login window style) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile background orbs */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-emerald-600/20" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-600/15" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold">VortexERP</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 ${authState === "serial-key" ? "text-emerald-400" : "text-emerald-400/50"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${authState === "serial-key" ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>1</div>
              <span className="text-xs font-medium">Device</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className={`flex items-center gap-1.5 ${authState === "login" ? "text-emerald-400" : "text-white/30"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${authState === "login" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50"}`}>2</div>
              <span className="text-xs font-medium">Sign In</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {authState === "serial-key" && (
              <motion.div key="serial-key" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Device Registration</h2>
                  <p className="text-sm text-white/50">Enter your serial key to register this device</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialKey" className="text-xs font-medium text-white/70">Serial Key</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input id="serialKey" type="text" placeholder="XXXX-XXXX-XXXX-XXXX" value={serialKey}
                      onChange={(e) => setSerialKey(e.target.value.toUpperCase())}
                      onKeyPress={(e) => handleKeyPress(e, handleSerialKeySubmit)}
                      className="pl-10 font-mono tracking-wider bg-[#1c1c1e] border-[#38383a] text-white placeholder:text-white/25 rounded-xl h-12 focus-visible:ring-emerald-500/40" disabled={loading} />
                  </div>
                </div>

                {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">{error}</p>}

                <Button onClick={handleSerialKeySubmit} disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 btn-glow text-white border-0 rounded-xl font-medium shadow-lg shadow-emerald-500/20">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Register Device
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center"><span className="bg-black px-3 text-xs text-white/30 uppercase">or</span></div>
                </div>

                <Button onClick={handleDemoLogin} disabled={loading} variant="outline"
                  className="w-full h-12 bg-[#1c1c1e] border-[#38383a] text-white hover:bg-[#2c2c2e] hover:border-emerald-400/40 rounded-xl font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />}
                  Explore Demo (View Only)
                </Button>
                <p className="text-xs text-center text-white/30">No registration needed — explore the full ERP with view-only access</p>
              </motion.div>
            )}

            {authState === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Sign In</h2>
                  <p className="text-sm text-white/50">Enter your credentials to access the platform</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-white/70">Email or Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input id="email" type="text" placeholder="sarah / admin@vortexdigital.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      className="pl-10 bg-[#1c1c1e] border-[#38383a] text-white placeholder:text-white/25 rounded-xl h-12 focus-visible:ring-emerald-500/40" disabled={loading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-white/70">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      className="pl-10 pr-10 bg-[#1c1c1e] border-[#38383a] text-white placeholder:text-white/25 rounded-xl h-12 focus-visible:ring-emerald-500/40" disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-white/30 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">{error}</p>}

                <Button onClick={handleLogin} disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 btn-glow text-white border-0 rounded-xl font-medium shadow-lg shadow-emerald-500/20">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Sign In
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center"><span className="bg-black px-3 text-xs text-white/30 uppercase">or</span></div>
                </div>

                <Button onClick={handleDemoLogin} disabled={loading} variant="outline"
                  className="w-full h-12 bg-[#1c1c1e] border-[#38383a] text-white hover:bg-[#2c2c2e] hover:border-emerald-400/40 rounded-xl font-medium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />}
                  Explore Demo (View Only)
                </Button>

                {/* ── Quick Employee Login ── */}
                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 text-center">Quick Employee Login (password: Vortex@2024)</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { username: 'sarah', role: 'Admin', color: 'hover:border-emerald-400' },
                      { username: 'emma', role: 'Designer', color: 'hover:border-teal-400' },
                      { username: 'james', role: 'Editor', color: 'hover:border-cyan-400' },
                      { username: 'lisa', role: 'Lead', color: 'hover:border-green-400' },
                      { username: 'david', role: 'Reviewer', color: 'hover:border-amber-400' },
                      { username: 'rachel', role: 'Approver', color: 'hover:border-orange-400' },
                      { username: 'alex', role: 'Dissem.', color: 'hover:border-purple-400' },
                      { username: 'mike', role: 'Manager', color: 'hover:border-blue-400' },
                    ].map((emp) => (
                      <button
                        key={emp.username}
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setEmail(emp.username)
                          setPassword('Vortex@2024')
                        }}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-lg bg-[#1c1c1e] border border-[#38383a] ${emp.color} transition-all text-white/70 hover:text-white disabled:opacity-50`}
                      >
                        <span className="text-xs font-semibold capitalize">{emp.username}</span>
                        <span className="text-[9px] text-white/40">{emp.role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device registered badge */}
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-white/40">Device registered — serial key not needed again</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-white/30">© 2026 VortexERP · All rights reserved</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-white/30">Powered by Neon PostgreSQL</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
