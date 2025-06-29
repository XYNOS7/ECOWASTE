"use client"

import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

export function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="mx-auto bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-16 h-16 flex items-center justify-center mb-4"
        >
          <Leaf className="w-8 h-8" />
        </motion.div>
        <h2 className="text-xl font-semibold text-green-600 mb-2">EcoTrack</h2>
        <p className="text-muted-foreground">Loading your eco-journey...</p>
        <motion.div
          className="mt-4 flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.6,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
