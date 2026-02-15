import simpleGit from "simple-git";
import type { Operation, Finding } from "@shipwell/core";

export interface PRResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
}

/**
 * Resolve a source (GitHub URL or local path) to a normalized GitHub HTTPS URL.
 */
export async function resolveRepoUrl(source: string): Promise<string> {
  // If source looks like a GitHub URL, normalize it
  const ghMatch = source.match(/github\.com\/([^/\s#?]+)\/([^/\s#?]+)/);
  if (ghMatch) {
    const repo = ghMatch[2].replace(/\.git$/, "");
    return `https://github.com/${ghMatch[1]}/${repo}`;
  }

  // Otherwise treat as a local path — read the git remote
  const git = simpleGit(source);
  let remoteUrl: string;
  try {
    remoteUrl = (await git.getConfig("remote.origin.url")).value ?? "";
  } catch {
    throw new Error("Not a git repository or no remote origin configured.");
  }

  if (!remoteUrl) {
    throw new Error("No remote origin URL found.");
  }

  // Convert SSH remote to HTTPS
  const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
  }

  // Already an HTTPS GitHub URL
  const httpsMatch = remoteUrl.match(/github\.com\/([^/\s#?]+)\/([^/\s#?]+)/);
  if (httpsMatch) {
    const repo = httpsMatch[2].replace(/\.git$/, "");
    return `https://github.com/${httpsMatch[1]}/${repo}`;
  }

  throw new Error(`Remote origin is not a GitHub URL: ${remoteUrl}`);
}

/**
 * Call the Shipwell API to create a fix PR via the GitHub App.
 */
export async function createFixPR(params: {
  repoUrl: string;
  operation: Operation;
  findings: Finding[];
  apiBase?: string;
}): Promise<PRResult> {
  const apiBase = params.apiBase || process.env.SHIPWELL_API_URL || "https://shipwell.app";
  const url = `${apiBase}/api/github/create-pr`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoUrl: params.repoUrl,
      operation: params.operation,
      findings: params.findings,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    const msg = body.error || `HTTP ${res.status}`;

    if (res.status === 404) {
      throw new Error(`GitHub App not installed: ${msg}`);
    }
    if (res.status === 422) {
      throw new Error(`No fixes could be applied: ${msg}`);
    }
    throw new Error(`PR creation failed: ${msg}`);
  }

  return (await res.json()) as PRResult;
}
