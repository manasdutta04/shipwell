import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import {
  parseDiffs,
  applyDiffToContent,
  buildPRTitle,
  buildPRDescription,
} from "@shipwell/core";
import type { Finding } from "@shipwell/core";

interface CreatePRRequest {
  repoUrl: string;
  operation: string;
  findings: Finding[];
}

const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/**
 * Get an Octokit instance authenticated as the GitHub App installation
 * for the given owner/repo. PRs created with this will show as "ShipwellHQ[bot]".
 */
async function getInstallationOctokit(owner: string, repo: string) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyBase64 = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKeyBase64) {
    throw new Error("GitHub App not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.");
  }

  // Private key is stored base64-encoded in env to avoid newline issues
  const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf-8");

  // Authenticate as the app to find the installation
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: Number(appId), privateKey },
  });

  // Find the installation for this repo
  const { data: installation } = await appOctokit.apps.getRepoInstallation({
    owner,
    repo,
  });

  // Get an installation-scoped Octokit
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Number(appId),
      privateKey,
      installationId: installation.id,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePRRequest;
    const { repoUrl, operation, findings } = body;

    if (!repoUrl || !findings?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 },
      );
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    // Authenticate as the GitHub App installation
    let octokit: Octokit;
    try {
      octokit = await getInstallationOctokit(owner, repo);
    } catch (err: any) {
      if (err.status === 404) {
        return NextResponse.json(
          {
            error: `Shipwell GitHub App is not installed on ${owner}/${repo}. Install it from your GitHub App settings.`,
          },
          { status: 404 },
        );
      }
      if (err.message?.includes("not configured")) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      throw err;
    }

    // Get default branch + latest commit SHA
    let defaultBranch: string;
    let latestSha: string;
    try {
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      defaultBranch = repoData.default_branch;

      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      latestSha = refData.object.sha;
    } catch (err: any) {
      if (err.status === 403) {
        return NextResponse.json(
          { error: "Insufficient permissions. The app needs Contents and Pull Request write access." },
          { status: 403 },
        );
      }
      if (err.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or app doesn't have access." },
          { status: 404 },
        );
      }
      throw err;
    }

    // Create branch
    const timestamp = Date.now();
    const branchName = `shipwell/fix-${operation}-${timestamp}`;
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: latestSha,
    });

    // Sort findings by severity (most severe first)
    const sortedFindings = [...findings].sort(
      (a, b) =>
        (severityOrder[a.severity ?? "info"] ?? 4) -
        (severityOrder[b.severity ?? "info"] ?? 4),
    );

    // Collect all files referenced in diffs
    const fileContentCache = new Map<string, string>();
    const deletedFiles = new Set<string>();
    const newFiles = new Set<string>();
    const appliedFindings: Array<{
      title: string;
      severity?: string;
      files: string[];
      category?: string;
    }> = [];
    const skippedFindings: Array<{ title: string; severity?: string }> = [];
    const failedFindings: Array<{
      title: string;
      severity?: string;
      error: string;
    }> = [];

    for (const finding of sortedFindings) {
      if (!finding.diff) {
        skippedFindings.push({
          title: finding.title,
          severity: finding.severity,
        });
        continue;
      }

      const diffs = parseDiffs(finding.diff);
      if (diffs.length === 0) {
        skippedFindings.push({
          title: finding.title,
          severity: finding.severity,
        });
        continue;
      }

      let allSuccess = true;
      let lastError = "";

      for (const diff of diffs) {
        // Handle file deletion (--- a/file +++ /dev/null)
        if (diff.isDeleted) {
          deletedFiles.add(diff.oldFile);
          continue;
        }

        // Handle new file creation (--- /dev/null +++ b/file)
        if (diff.isNewFile) {
          const result = applyDiffToContent("", diff);
          if (result.success) {
            fileContentCache.set(diff.newFile, result.newContent);
            newFiles.add(diff.newFile);
          } else {
            allSuccess = false;
            lastError = result.error ?? "Failed to create new file";
          }
          continue;
        }

        const filePath = diff.newFile || diff.oldFile;

        // Fetch existing file content if not cached
        if (!fileContentCache.has(filePath)) {
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path: filePath,
              ref: defaultBranch,
            });

            if ("content" in data && data.type === "file") {
              const content = Buffer.from(data.content, "base64").toString(
                "utf-8",
              );
              fileContentCache.set(filePath, content);
            } else {
              lastError = `${filePath} is not a file`;
              allSuccess = false;
              continue;
            }
          } catch {
            lastError = `Could not fetch ${filePath}`;
            allSuccess = false;
            continue;
          }
        }

        const currentContent = fileContentCache.get(filePath)!;
        const result = applyDiffToContent(currentContent, diff);

        if (result.success) {
          // Update cache for cumulative edits
          fileContentCache.set(filePath, result.newContent);
        } else {
          allSuccess = false;
          lastError = result.error ?? "Failed to apply diff";
        }
      }

      if (allSuccess) {
        appliedFindings.push({
          title: finding.title,
          severity: finding.severity,
          files: finding.files,
          category: finding.category,
        });
      } else {
        failedFindings.push({
          title: finding.title,
          severity: finding.severity,
          error: lastError,
        });
      }
    }

    if (appliedFindings.length === 0 && deletedFiles.size === 0) {
      // Clean up the branch we created since we can't apply anything
      try {
        await octokit.git.deleteRef({
          owner,
          repo,
          ref: `heads/${branchName}`,
        });
      } catch {
        // best-effort cleanup
      }

      const details = failedFindings
        .map((f) => `• ${f.title}: ${f.error}`)
        .join("\n");
      const skippedDetail = skippedFindings.length > 0
        ? `\n${skippedFindings.length} findings had no diffs.`
        : "";

      return NextResponse.json(
        {
          error: `No diffs could be applied.${skippedDetail}`,
          failedFindings,
          skippedFindings,
          details,
        },
        { status: 422 },
      );
    }

    // Create blobs + tree + commit via Git Data API
    const { data: baseCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestSha,
    });

    const treeItems: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      sha: string | null;
    }> = [];

    // Add new/modified files
    for (const [filePath, content] of fileContentCache) {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      });
      treeItems.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    // Add deleted files (sha: null removes the file from the tree)
    for (const filePath of deletedFiles) {
      // Only delete if we're not also creating/modifying it
      if (!fileContentCache.has(filePath)) {
        treeItems.push({
          path: filePath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      }
    }

    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: treeItems as any,
    });

    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: buildPRTitle(operation, appliedFindings.length),
      tree: tree.sha,
      parents: [latestSha],
    });

    // Update branch ref to point to new commit
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: commit.sha,
    });

    // Create PR
    const prBody = buildPRDescription({
      operation,
      source: repoUrl,
      appliedFindings,
      skippedFindings,
      failedFindings,
    });

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: buildPRTitle(operation, appliedFindings.length),
      body: prBody,
      head: branchName,
      base: defaultBranch,
    });

    return NextResponse.json({
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch: branchName,
      appliedCount: appliedFindings.length,
      skippedCount: skippedFindings.length,
      failedCount: failedFindings.length,
    });
  } catch (err: any) {
    console.error("Create PR error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
