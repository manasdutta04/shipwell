"use client";

import { useState, useCallback, useRef } from "react";
import type { Finding, MetricEvent } from "@shipwell/core/client";

export interface ActivityEntry {
  id: string;
  icon: "clone" | "read" | "bundle" | "analyze" | "finding" | "metric" | "done" | "error";
  message: string;
  timestamp: number;
  done: boolean;
}

export interface SSEState {
  status: "idle" | "connecting" | "streaming" | "complete" | "error";
  rawText: string;
  findings: Finding[];
  metrics: MetricEvent[];
  summary: string | null;
  error: string | null;
  phase: string | null;
  activity: ActivityEntry[];
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    status: "idle",
    rawText: "",
    findings: [],
    metrics: [],
    summary: null,
    error: null,
    phase: null,
    activity: [],
  });

  const abortRef = useRef<AbortController | null>(null);
  const activityRef = useRef<ActivityEntry[]>([]);
  const findingCountRef = useRef(0);

  function addActivity(icon: ActivityEntry["icon"], message: string, done = false): string {
    const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry: ActivityEntry = { id, icon, message, timestamp: Date.now(), done };
    activityRef.current = [...activityRef.current, entry];
    setState(prev => ({ ...prev, activity: activityRef.current }));
    return id;
  }

  function completeActivity(id: string) {
    activityRef.current = activityRef.current.map(a =>
      a.id === id ? { ...a, done: true } : a
    );
    setState(prev => ({ ...prev, activity: activityRef.current }));
  }

  const start = useCallback(async (body: {
    operation: string;
    source: string;
    apiKey: string;
    model?: string;
    target?: string;
    context?: string;
  }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    activityRef.current = [];
    findingCountRef.current = 0;

    setState({
      status: "connecting",
      rawText: "",
      findings: [],
      metrics: [],
      summary: null,
      error: null,
      phase: "ingesting",
      activity: [],
    });

    const isGithub = body.source.startsWith("https://github.com");
    const connectId = addActivity(
      "clone",
      isGithub ? `Cloning ${body.source.split("/").slice(-2).join("/")}...` : `Reading ${body.source}...`
    );

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        completeActivity(connectId);
        addActivity("error", err || `HTTP ${response.status}`, true);
        setState(prev => ({ ...prev, status: "error", error: err || `HTTP ${response.status}` }));
        return;
      }

      completeActivity(connectId);

      const reader = response.body?.getReader();
      if (!reader) {
        addActivity("error", "No response body", true);
        setState(prev => ({ ...prev, status: "error", error: "No response body" }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      const allFindings: Finding[] = [];
      const allMetrics: MetricEvent[] = [];
      let analyzeId: string | null = null;

      setState(prev => ({ ...prev, status: "streaming", phase: "analyzing" }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "text") {
                fullText += event.data;
                setState(prev => ({ ...prev, rawText: fullText }));
              } else if (event.type === "finding") {
                allFindings.push(event.data);
                findingCountRef.current++;
                const f = event.data;
                const severity = f.severity ? `[${f.severity}] ` : "";
                const cross = f.crossFile ? " (cross-file)" : "";
                addActivity("finding", `${severity}${f.title}${cross}`, true);
                setState(prev => ({ ...prev, findings: [...allFindings] }));
              } else if (event.type === "metric") {
                allMetrics.push(event.data);
                addActivity("metric", `${event.data.label}: ${event.data.before} → ${event.data.after}`, true);
                setState(prev => ({ ...prev, metrics: [...allMetrics] }));
              } else if (event.type === "status") {
                const phase = event.data.phase;
                const msg = event.data.message;

                if (phase === "bundling") {
                  addActivity("read", msg, true);
                } else if (phase === "analyzing") {
                  addActivity("bundle", msg, true);
                  analyzeId = addActivity("analyze", `Running ${body.operation} analysis...`);
                } else if (phase === "complete") {
                  if (analyzeId) completeActivity(analyzeId);
                }

                setState(prev => ({ ...prev, phase }));
              } else if (event.type === "summary") {
                setState(prev => ({ ...prev, summary: event.data }));
              } else if (event.type === "error") {
                if (analyzeId) completeActivity(analyzeId);
                addActivity("error", event.data, true);
                setState(prev => ({ ...prev, status: "error", error: event.data }));
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (analyzeId) completeActivity(analyzeId);
      addActivity("done", `Analysis complete — ${allFindings.length} findings`, true);
      setState(prev => ({ ...prev, status: "complete" }));
    } catch (err: any) {
      if (err.name === "AbortError") return;
      addActivity("error", err.message, true);
      setState(prev => ({ ...prev, status: "error", error: err.message }));
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    addActivity("done", "Analysis stopped", true);
    setState(prev => ({ ...prev, status: "complete" }));
  }, []);

  return { ...state, start, stop };
}
