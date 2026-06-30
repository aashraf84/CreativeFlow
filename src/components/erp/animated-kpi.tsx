"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/erp/animated-counter"

interface AnimatedKPIProps {
  icon: React.ElementType
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  colorClass: string
  bgClass: string
  sub?: string
  index?: number
}

export function AnimatedKPI({ icon: Icon, label, value, prefix, suffix, decimals, colorClass, bgClass, sub, index = 0 }: AnimatedKPIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={`p-2 rounded-xl ${bgClass}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.06 + 0.15, type: "spring", stiffness: 300 }}
            >
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] font-medium">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-[#1d1d1f] dark:text-white">
                <AnimatedCounter value={value} duration={1000} prefix={prefix} suffix={suffix} decimals={decimals} />
              </p>
              {sub && <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] mt-0.5">{sub}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
