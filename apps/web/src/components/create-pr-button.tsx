"use client";

import { useState, useCallback } from "react";
import { GitPullRequest, Loader2, Check, ExternalLink } from "lucide-react";
import clsx from "clsx";
import type { Finding } from "@shipwell/core/client";

type PRState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "success"; prUrl: string; prNumber: number }
  | { status: "error"; message: string };

interface CreatePRButtonProps {
  findings: Finding[];
  operation: string;
  source: string;
}

export function CreatePRButton({
  findings,
  operation,
  source,
}: CreatePRButtonProps) {
  const [state, setState] = useState<PRState>({ status: "idle" });

  const fixableCount = findings.filter((f) => !!f.diff).length;
  const disabled = fixableCount === 0 || state.status === "creating";

  const handleCreate = useCallback(async () => {
    if (disabled) return;

    setState({ status: "creating" });

    try {
      const res = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: source,
          operation,
          findings,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error || `HTTP ${res.status}` });
        return;
      }

      setState({
        status: "success",
        prUrl: data.prUrl,
        prNumber: data.prNumber,
      });
    } catch (err: any) {
      setState({
        status: "error",
        message: err.message || "Failed to create PR",
      });
    }
  }, [disabled, source, operation, findings]);

  if (state.status === "success") {
    return (
      <a
        href={state.prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium",
          "text-emerald-400 hover:text-emerald-300",
          "bg-emerald-500/10 hover:bg-emerald-500/15",
          "rounded-lg border border-emerald-500/20 transition-colors",
        )}
      >
        <Check className="w-3.5 h-3.5" />
        PR #{state.prNumber} Created
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCreate}
        disabled={disabled}
        title={
          fixableCount === 0
            ? "No findings with diffs to fix"
            : undefined
        }
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium",
          "rounded-lg border transition-colors",
          disabled
            ? "text-text-dim bg-bg-elevated/50 border-border/50 cursor-not-allowed opacity-50"
            : "text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/20",
        )}
      >
        {state.status === "creating" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Creating PR...
          </>
        ) : (
          <>
            <GitPullRequest className="w-3.5 h-3.5" />
            Create Fix PR ({fixableCount})
          </>
        )}
      </button>
      {state.status === "error" && (
        <button
          onClick={() => setState({ status: "idle" })}
          className="text-[11px] text-red-400 max-w-[300px] truncate hover:text-red-300 transition-colors"
          title={state.message}
        >
          {state.message} (click to retry)
        </button>
      )}
    </div>
  );
}
