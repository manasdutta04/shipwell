"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  GitBranch, FolderOpen, Package, Scan, Shield, BarChart3,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { ActivityEntry } from "@/hooks/use-sse";

const iconMap = {
  clone: GitBranch,
  read: FolderOpen,
  bundle: Package,
  analyze: Scan,
  finding: Shield,
  metric: BarChart3,
  done: CheckCircle2,
  error: XCircle,
};

const iconColor = {
  clone: "text-blue-400",
  read: "text-cyan-400",
  bundle: "text-purple-400",
  analyze: "text-accent",
  finding: "text-yellow-400",
  metric: "text-green-400",
  done: "text-success",
  error: "text-danger",
};

export function ActivityLog({
  activity,
  isRunning,
}: {
  activity: ActivityEntry[];
  isRunning: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activity.length]);

  if (activity.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        )}
        <span className="text-xs font-medium text-text-muted">Activity</span>
        <span className="text-xs text-text-dim ml-auto">{activity.length} steps</span>
      </div>
      <div className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-0.5">
        {activity.map((entry, i) => {
          const Icon = iconMap[entry.icon];
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2.5 py-1 group"
            >
              {/* Timeline line + icon */}
              <div className="relative flex flex-col items-center">
                <div className={clsx(
                  "w-5 h-5 rounded flex items-center justify-center shrink-0",
                  !entry.done && !["finding", "metric", "done", "error"].includes(entry.icon)
                    ? "bg-accent/10"
                    : "bg-bg-elevated"
                )}>
                  {!entry.done ? (
                    <Loader2 className="w-3 h-3 animate-spin text-accent" />
                  ) : (
                    <Icon className={clsx("w-3 h-3", iconColor[entry.icon])} />
                  )}
                </div>
                {i < activity.length - 1 && (
                  <div className="w-px h-full bg-border absolute top-5 left-1/2 -translate-x-1/2" />
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0 pt-0.5">
                <span className={clsx(
                  "text-xs leading-relaxed",
                  entry.done ? "text-text-muted" : "text-text"
                )}>
                  {entry.message}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
