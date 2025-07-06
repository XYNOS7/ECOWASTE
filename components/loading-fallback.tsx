"use client"

import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-4"
        >
          <Leaf className="w-12 h-12 text-green-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">Loading EcoTrack...</h2>
        <p className="text-muted-foreground">Making the world greener, one report at a time</p>
      </motion.div>
    </div>
  )
}