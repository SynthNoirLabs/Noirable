"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TypewriterTextProps {
  content: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  className?: string
}

const priorityMap = {
  low: 'text-noir-gray',
  normal: 'text-noir-ink', // Assumes light background (paper)
  high: 'text-noir-amber',
  critical: 'text-noir-red',
}

export function TypewriterText({ content, priority = 'normal', className }: TypewriterTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "font-typewriter text-lg tracking-wide",
        priorityMap[priority],
        className
      )}
    >
      {content}
    </motion.div>
  )
}
