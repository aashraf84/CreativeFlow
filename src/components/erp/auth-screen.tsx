"use client"

import React, { useState, useEffect } from "react"
import { useERPStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, KeyRound, LogIn, Sparkles, Shield, Zap, Lock, ArrowRight, Loader2, User } from "lucide-react"

export function AuthScreen() {
  const { authState, setAuthState, setCurrentUser, setIsViewOnly, setDeviceRegistered } = useERPStore()

  const [serialKey, setSerialKey] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceId] = useState(() => {
    if (typeof window === "undefined") return ""
    const id = localStorage.getItem("erp_device_id") || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("erp_device_id", id)
    return id
  })

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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch("/api/auth/serial-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialKey: serialKey.trim(), deviceId, userAgent: navigator.userAgent }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Invalid serial key"); return }
      localStorage.setItem("erp_device_registered", "true")
      localStorage.setItem("erp_serial_key", serialKey.trim())
      setDeviceRegistered(true)
      setAuthState("login")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") setError("Request timed out. Please try again.")
      else setError("Failed to validate serial key. Please try again.")
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setError("")
    if (!email.trim() || !password.trim()) { setError("Please enter email and password"); return }
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, deviceId }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Login failed"); return }
      const userData = { id: data.user.id, email: data.user.email, name: data.user.name, avatar: data.user.avatar, role: data.user.role, organizationId: data.user.organizationId }
      setCurrentUser(userData)
      setIsViewOnly(false)
      localStorage.setItem("erp_session", JSON.stringify({ user: userData, isDemo: false }))
      setAuthState("authenticated")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") setError("Request timed out. Please try again.")
      else setError("Failed to login. Please try again.")
    }
    setLoading(false)
  }

  const handleDemoLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch("/api/auth/demo-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Demo login failed"); return }
      const userData = { id: data.user.id, email: data.user.email, name: data.user.name, avatar: data.user.avatar, role: "demo", organizationId: data.user.organizationId }
      setCurrentUser(userData)
      setIsViewOnly(true)
      localStorage.setItem("erp_session", JSON.stringify({ user: userData, isDemo: true }))
      localStorage.setItem("erp_device_registered", "true")
      setDeviceRegistered(true)
      setAuthState("authenticated")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") setError("Demo login timed out. Please try again.")
      else setError("Failed to login as demo. Please try again.")
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action()
  }

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden">
        {/* Aurora background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 relative" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white p-4 relative overflow-hidden">
      {/* Aurora background blobs (immersive dark design) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl vortex-float" />
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl vortex-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl vortex-float" style={{ animationDelay: "2s" }} />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left - Branding */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <Zap className="h-8 w-8 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">VortexERP</h1>
              <p className="text-sm text-white/60">Social Media Agency Management Platform</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: Shield, title: "Enterprise Security", desc: "Serial key device authentication" },
              { icon: Zap, title: "Multi-Tenant Architecture", desc: "Neon PostgreSQL powered" },
              { icon: Sparkles, title: "26+ Modules", desc: "Finance, HR, Inventory, Analytics & more" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/20"><feature.icon className="h-5 w-5 text-emerald-300" /></div>
                <div><p className="font-medium text-sm text-white">{feature.title}</p><p className="text-xs text-white/50">{feature.desc}</p></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right - Auth forms (glass card on dark immersive background) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-emerald-500/10 rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 lg:hidden">
                  <Zap className="h-5 w-5 text-white" fill="white" />
                </div>
                <span className="text-xs font-medium text-emerald-300 lg:hidden">VortexERP</span>
              </div>
              <AnimatePresence mode="wait">
                {authState === "serial-key" && (
                  <motion.div key="serial-key" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <CardTitle className="text-xl flex items-center gap-2 text-white"><KeyRound className="h-5 w-5 text-emerald-400" />Device Registration</CardTitle>
                    <p className="text-sm text-white/60 mt-1">Enter your serial key to register this device</p>
                  </motion.div>
                )}
                {authState === "login" && (
                  <motion.div key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <CardTitle className="text-xl flex items-center gap-2 text-white"><LogIn className="h-5 w-5 text-emerald-400" />Sign In</CardTitle>
                    <p className="text-sm text-white/60 mt-1">Enter your credentials to access the platform</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {authState === "serial-key" && (
                  <motion.div key="serial-key-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialKey" className="text-xs font-medium text-white/80">Serial Key</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                        <Input id="serialKey" type="text" placeholder="XXXX-XXXX-XXXX-XXXX" value={serialKey}
                          onChange={(e) => setSerialKey(e.target.value.toUpperCase())}
                          onKeyPress={(e) => handleKeyPress(e, handleSerialKeySubmit)}
                          className="pl-9 font-mono tracking-wider bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/40" disabled={loading} />
                      </div>
                    </div>
                    {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{error}</p>}
                    <Button onClick={handleSerialKeySubmit} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-md shadow-emerald-500/30">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}Register Device
                    </Button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-white/40">or</span></div></div>
                    <Button onClick={handleDemoLogin} disabled={loading} variant="outline" className="w-full bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08] hover:border-emerald-400/40">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />}Explore Demo (View Only)
                    </Button>
                    <p className="text-xs text-center text-white/40">No registration needed — explore the full ERP with view-only access</p>
                  </motion.div>
                )}
                {authState === "login" && (
                  <motion.div key="login-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-white/80">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                        <Input id="email" type="email" placeholder="admin@vortexdigital.com" value={email}
                          onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                          className="pl-9 bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/40" disabled={loading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-medium text-white/80">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                          onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                          className="pl-9 pr-9 bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/40" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-white/40 hover:text-white">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{error}</p>}
                    <Button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-md shadow-emerald-500/30">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}Sign In
                    </Button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-white/40">or</span></div></div>
                    <Button onClick={handleDemoLogin} disabled={loading} variant="outline" className="w-full bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08] hover:border-emerald-400/40">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />}Explore Demo (View Only)
                    </Button>
                  {/* Device already registered — no reset option */}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
