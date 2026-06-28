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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left - Branding */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-8 w-8 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">VortexERP</h1>
              <p className="text-sm text-muted-foreground">Social Media Agency Management Platform</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: Shield, title: "Enterprise Security", desc: "Serial key device authentication" },
              { icon: Zap, title: "Multi-Tenant Architecture", desc: "Neon PostgreSQL powered" },
              { icon: Sparkles, title: "26+ Modules", desc: "Finance, HR, Inventory, Analytics & more" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100"><feature.icon className="h-5 w-5 text-emerald-700" /></div>
                <div><p className="font-medium text-sm">{feature.title}</p><p className="text-xs text-muted-foreground">{feature.desc}</p></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right - Auth forms */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-0 shadow-xl shadow-emerald-500/10">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 lg:hidden">
                  <Zap className="h-5 w-5 text-white" fill="white" />
                </div>
                <span className="text-xs font-medium text-emerald-600 lg:hidden">VortexERP</span>
              </div>
              <AnimatePresence mode="wait">
                {authState === "serial-key" && (
                  <motion.div key="serial-key" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <CardTitle className="text-xl flex items-center gap-2"><KeyRound className="h-5 w-5 text-emerald-600" />Device Registration</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Enter your serial key to register this device</p>
                  </motion.div>
                )}
                {authState === "login" && (
                  <motion.div key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <CardTitle className="text-xl flex items-center gap-2"><LogIn className="h-5 w-5 text-emerald-600" />Sign In</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the platform</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {authState === "serial-key" && (
                  <motion.div key="serial-key-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialKey" className="text-xs font-medium">Serial Key</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="serialKey" type="text" placeholder="XXXX-XXXX-XXXX-XXXX" value={serialKey}
                          onChange={(e) => setSerialKey(e.target.value.toUpperCase())}
                          onKeyPress={(e) => handleKeyPress(e, handleSerialKeySubmit)}
                          className="pl-9 font-mono tracking-wider" disabled={loading} />
                      </div>
                    </div>
                    {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                    <Button onClick={handleSerialKeySubmit} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}Register Device
                    </Button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
                    <Button onClick={handleDemoLogin} disabled={loading} variant="outline" className="w-full border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-600" />}Explore Demo (View Only)
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">No registration needed — explore the full ERP with view-only access</p>
                  </motion.div>
                )}
                {authState === "login" && (
                  <motion.div key="login-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="admin@vortexdigital.com" value={email}
                          onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                          className="pl-9" disabled={loading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                          onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                          className="pl-9 pr-9" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                    <Button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}Sign In
                    </Button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
                    <Button onClick={handleDemoLogin} disabled={loading} variant="outline" className="w-full border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-emerald-600" />}Explore Demo (View Only)
                    </Button>
                    <button onClick={() => setAuthState("serial-key")} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                      <KeyRound className="h-3 w-3" /> Use a different serial key
                    </button>
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
