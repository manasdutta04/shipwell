"use client";

import { useEffect, useRef } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

export function StreamingOutput({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) return null;

  // Simple syntax highlighting for the XML output
  const highlighted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Highlight XML tags
    .replace(/&lt;(\/?[\w-]+)(.*?)&gt;/g, '<span class="text-accent">$&</span>')
    // Highlight diff markers
    .replace(/^(\+.*)$/gm, '<span class="text-success">$1</span>')
    .replace(/^(-.*)$/gm, '<span class="text-danger">$1</span>')
    .replace(/^(@@.*)$/gm, '<span class="text-info">$1</span>');

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-danger/60" />
            <span className="w-3 h-3 rounded-full bg-warning/60" />
            <span className="w-3 h-3 rounded-full bg-success/60" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-text-dim" />
            <span className="text-[12px] text-text-dim font-medium">Raw Output</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-text-dim hover:text-text hover:bg-bg-elevated transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Output Area */}
      <div
        ref={containerRef}
        className="h-[400px] overflow-y-auto p-4 bg-bg"
      >
        <pre
          className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-text-muted"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-accent cursor-blink ml-0.5 rounded-sm" />
        )}
      </div>
    </div>
  );
}
