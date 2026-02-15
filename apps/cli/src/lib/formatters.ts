import chalk from "chalk";
import type { Finding, MetricEvent } from "@shipwell/core";

const accent = chalk.hex("#6366f1");
const dim = chalk.dim;
const bold = chalk.bold;

// ─── Box drawing helpers ────────────────────────────────────

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function visLen(s: string): number {
  const plain = stripAnsi(s);
  let len = 0;
  for (const ch of plain) {
    const code = ch.codePointAt(0) || 0;
    // Most emoji and wide characters occupy 2 terminal columns
    if (code > 0x1000) len += 2;
    else len += 1;
  }
  return len;
}

function padR(s: string, w: number): string {
  const gap = w - visLen(s);
  return gap > 0 ? s + " ".repeat(gap) : s;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")   // **bold**
    .replace(/\*([^*]+)\*/g, "$1")        // *italic*
    .replace(/`([^`]+)`/g, "$1")          // `code`
    .replace(/#{1,6}\s*/g, "")            // ### headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [text](url)
}

function wordWrap(s: string, width: number, indent: string, maxLines: number): string[] {
  // Clean: collapse whitespace, strip markdown
  const flat = stripMarkdown(s).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  const words = flat.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (lines.length >= maxLines) break;
    if (current.length + word.length + 1 > width) {
      lines.push(indent + dim(current));
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(indent + dim(current));
  } else if (lines.length === maxLines && current) {
    // Append ellipsis to last line
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last + dim("\u2026");
  }

  return lines;
}

// ─── Severity colors ────────────────────────────────────────

const severityColor: Record<string, (s: string) => string> = {
  critical: chalk.red.bold,
  high: chalk.hex("#f97316").bold,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.dim,
};

const severityIcon: Record<string, string> = {
  critical: "\u{1F534}",
  high: "\u{1F7E0}",
  medium: "\u{1F7E1}",
  low: "\u{1F535}",
};

// ─── Public formatters ──────────────────────────────────────

export interface SummaryStats {
  totalFindings: number;
  critCount: number;
  highCount: number;
  medCount: number;
  lowCount: number;
  crossFileCount: number;
  filesAnalyzed: number;
  tokensK: number;
  elapsed: string;
}

export function formatSeverityRow(findings: Finding[]): string {
  const crit = findings.filter(f => f.severity === "critical").length;
  const high = findings.filter(f => f.severity === "high").length;
  const med = findings.filter(f => f.severity === "medium").length;
  const low = findings.filter(f => f.severity === "low").length;

  const parts = [
    crit > 0 ? `${severityIcon.critical} ${crit} critical` : null,
    high > 0 ? `${severityIcon.high} ${high} high` : null,
    med > 0 ? `${severityIcon.medium} ${med} medium` : null,
    low > 0 ? `${severityIcon.low} ${low} low` : null,
  ].filter(Boolean);

  return parts.join(dim(" \u00B7 "));
}

export function formatSummaryBox(stats: SummaryStats): string {
  const W = 54;
  const bar = dim("\u2502");
  const pad = (s: string) => {
    const plain = stripAnsi(s);
    const gap = W - 2 - plain.length;
    return gap > 0 ? s + " ".repeat(gap) : s;
  };

  const sevParts = [
    stats.critCount > 0 ? chalk.red(`${stats.critCount} critical`) : null,
    stats.highCount > 0 ? chalk.hex("#f97316")(`${stats.highCount} high`) : null,
    stats.medCount > 0 ? chalk.yellow(`${stats.medCount} medium`) : null,
    stats.lowCount > 0 ? chalk.blue(`${stats.lowCount} low`) : null,
  ].filter(Boolean);

  const findingsRow = sevParts.length > 0
    ? `${bold(String(stats.totalFindings))} findings: ${sevParts.join(dim(" / "))}`
    : `${bold(String(stats.totalFindings))} findings`;

  const crossRow = stats.crossFileCount > 0
    ? `${accent(String(stats.crossFileCount))} cross-file issues detected`
    : null;

  const statsRow = `${stats.filesAnalyzed} files analyzed | ${stats.tokensK}K tokens | ${stats.elapsed}s`;

  const lines: string[] = [];
  lines.push(`  ${dim("\u256D" + "\u2500".repeat(W - 2) + "\u256E")}`);
  lines.push(`  ${bar} ${pad(accent("Analysis Complete"))} ${bar}`);
  lines.push(`  ${bar} ${pad("")} ${bar}`);
  lines.push(`  ${bar} ${pad(findingsRow)} ${bar}`);
  if (crossRow) {
    lines.push(`  ${bar} ${pad(crossRow)} ${bar}`);
  }
  lines.push(`  ${bar} ${pad(dim(statsRow))} ${bar}`);
  lines.push(`  ${dim("\u2570" + "\u2500".repeat(W - 2) + "\u256F")}`);

  return lines.join("\n");
}

/** Compact finding card — streams in real-time during analysis */
export function formatFindingCard(f: Finding, i: number): string {
  const sev = f.severity || "info";
  const color = severityColor[sev] || chalk.dim;
  const num = dim(`${String(i + 1).padStart(2)}.`);
  const badge = color(`[${sev.toUpperCase()}]`);
  const cross = f.crossFile ? accent(" \u27F7") : "";

  const header = `  ${num} ${bold(f.title)} ${badge}${cross}`;
  const lines: string[] = [header];

  if (f.files.length > 0) {
    lines.push(`     ${f.files.map(file => chalk.cyan(file)).join(dim(", "))}`);
  }
  if (f.description) {
    lines.push(...wordWrap(f.description, 72, "     ", Infinity));
  }

  return lines.join("\n");
}

export function formatMetric(m: MetricEvent): string {
  return `  ${dim("\u2022")} ${m.label}: ${chalk.red(String(m.before))} ${dim("\u2192")} ${chalk.green(String(m.after))}${m.unit ? dim(` ${m.unit}`) : ""}`;
}
