"use client";

import Link from "next/link";
import { Ship, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const floatingParticles = [
  { left: "10%", delay: "0s", duration: "7s" },
  { left: "30%", delay: "1.5s", duration: "9s" },
  { left: "55%", delay: "2.8s", duration: "8s" },
  { left: "75%", delay: "0.6s", duration: "10s" },
  { left: "90%", delay: "2s", duration: "7.5s" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Floating particles */}
      {floatingParticles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-1 h-1 rounded-full bg-accent/30 float-particle"
          style={{
            left: p.left,
            "--delay": p.delay,
            "--duration": p.duration,
          } as React.CSSProperties}
        />
      ))}

      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md relative"
        >
          {/* Ship icon with orbit rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-[-8px] orbit-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent/40" />
              </div>
              <div className="absolute inset-[-16px] orbit-reverse">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400/30" />
              </div>
              <Ship className="w-12 h-12 text-accent/40 relative" />
            </div>
          </motion.div>

          {/* 404 heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h1
              className="text-7xl md:text-8xl font-bold gradient-text mb-3"
              style={{ fontFamily: "Menlo, Monaco, 'Courier New', monospace" }}
            >
              404
            </h1>
            <p className="text-text-muted text-sm leading-relaxed mb-2">
              This route doesn&apos;t exist in the codebase.
            </p>
            <p
              className="text-text-dim text-xs"
              style={{ fontFamily: "Menlo, Monaco, 'Courier New', monospace" }}
            >
              ERR_MODULE_NOT_FOUND
            </p>
          </motion.div>

          {/* Terminal card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-8 bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/70" />
            </div>
            <div
              className="px-5 py-4 text-left text-[13px] leading-[1.8]"
              style={{ fontFamily: "Menlo, Monaco, 'Courier New', monospace" }}
            >
              <div>
                <span className="text-success">$</span>{" "}
                <span className="text-text">shipwell navigate</span>{" "}
                <span className="text-text-dim">/unknown</span>
              </div>
              <div className="text-[#ef4444]">
                error: route not found in project graph
              </div>
              <div className="text-text-dim">
                <span className="text-accent">{"\u26F5"}</span> Redirecting to home...
              </div>
            </div>
          </motion.div>

          {/* Back home link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-6 py-2.5 text-sm font-semibold font-mono transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
