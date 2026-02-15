export interface ParsedHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: HunkLine[];
}

export interface HunkLine {
  type: "context" | "add" | "remove";
  content: string;
}

export interface ParsedDiff {
  oldFile: string;
  newFile: string;
  hunks: ParsedHunk[];
  /** True when oldFile is /dev/null — this is a newly created file */
  isNewFile: boolean;
  /** True when newFile is /dev/null — this file is being deleted */
  isDeleted: boolean;
}

export interface ApplyResult {
  success: boolean;
  filePath: string;
  newContent: string;
  error?: string;
  /** True when this result creates a brand-new file */
  isNewFile?: boolean;
  /** True when this result deletes the file */
  isDeleted?: boolean;
}

/** Remove markdown code fences Claude sometimes wraps diffs in. */
export function stripCodeFences(raw: string): string {
  let text = raw.trim();
  if (/^```[\w-]*\s*\n/.test(text)) {
    text = text.replace(/^```[\w-]*\s*\n/, "");
  }
  if (/\n```\s*$/.test(text)) {
    text = text.replace(/\n```\s*$/, "");
  }
  return text;
}

/**
 * Split a multi-file unified diff into per-file ParsedDiff objects.
 * Handles standard unified diff format with --- / +++ / @@ headers.
 */
export function parseDiffs(raw: string): ParsedDiff[] {
  const cleaned = stripCodeFences(raw);
  const lines = cleaned.split("\n");
  const diffs: ParsedDiff[] = [];

  let currentDiff: ParsedDiff | null = null;
  let currentHunk: ParsedHunk | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header: --- a/path or --- path
    if (line.startsWith("--- ")) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.startsWith("+++ ")) {
        const oldFile = parseFilePath(line.slice(4));
        const newFile = parseFilePath(nextLine.slice(4));
        currentDiff = {
          oldFile,
          newFile,
          hunks: [],
          isNewFile: isDevNull(oldFile),
          isDeleted: isDevNull(newFile),
        };
        diffs.push(currentDiff);
        currentHunk = null;
        i++; // skip the +++ line
        continue;
      }
    }

    // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(
      /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/,
    );
    if (hunkMatch && currentDiff) {
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldCount: hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1,
        newStart: parseInt(hunkMatch[3], 10),
        newCount: hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1,
        lines: [],
      };
      currentDiff.hunks.push(currentHunk);
      continue;
    }

    // Diff content lines
    if (currentHunk) {
      if (line.startsWith("+")) {
        currentHunk.lines.push({ type: "add", content: line.slice(1) });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({ type: "remove", content: line.slice(1) });
      } else if (line.startsWith(" ") || line === "") {
        currentHunk.lines.push({
          type: "context",
          content: line.startsWith(" ") ? line.slice(1) : line,
        });
      }
    }
  }

  return diffs;
}

/** Strip "a/" or "b/" prefix from diff file paths. */
function parseFilePath(raw: string): string {
  let p = raw.trim();
  if (p === "/dev/null") return "/dev/null";
  if (p.startsWith("a/") || p.startsWith("b/")) {
    p = p.slice(2);
  }
  return p;
}

function isDevNull(path: string): boolean {
  return path === "/dev/null";
}

/**
 * Apply a single parsed diff to original file content using fuzzy matching.
 *
 * Strategy for each hunk:
 *  1. Build the "old lines" (context + remove in original order) — these must exist in the file
 *  2. Try exact line from the @@ header
 *  3. Search nearby (+/- 20 lines) for matching old lines
 *  4. Search entire file
 *  5. If still no match, try single-line matching for the first remove line
 *  6. Replace matched region with "new lines" (context + add in original order)
 */
export function applyDiffToContent(
  original: string,
  diff: ParsedDiff,
): ApplyResult {
  // New file creation: build content entirely from addition lines
  if (diff.isNewFile) {
    const newLines: string[] = [];
    for (const hunk of diff.hunks) {
      for (const hl of hunk.lines) {
        if (hl.type === "add") {
          newLines.push(hl.content);
        }
      }
    }
    return {
      success: true,
      filePath: diff.newFile,
      newContent: newLines.join("\n"),
      isNewFile: true,
    };
  }

  // File deletion: return empty content with deleted flag
  if (diff.isDeleted) {
    return {
      success: true,
      filePath: diff.oldFile,
      newContent: "",
      isDeleted: true,
    };
  }

  const filePath = diff.newFile || diff.oldFile;
  let fileLines = original.split("\n");

  for (const hunk of diff.hunks) {
    // Build old lines (what should exist in the file) in their original order
    const oldLines: string[] = [];
    for (const hl of hunk.lines) {
      if (hl.type === "context" || hl.type === "remove") {
        oldLines.push(hl.content);
      }
    }

    // Build new lines (what replaces the old lines) in their original order
    const newLines: string[] = [];
    for (const hl of hunk.lines) {
      if (hl.type === "context" || hl.type === "add") {
        newLines.push(hl.content);
      }
    }

    if (oldLines.length === 0) {
      // Pure addition — insert at the hunk's indicated position
      const insertAt = Math.min(hunk.oldStart - 1, fileLines.length);
      fileLines.splice(insertAt, 0, ...newLines);
      continue;
    }

    // Find where old lines match in the file
    let matchIndex = findHunkPosition(fileLines, oldLines, hunk.oldStart);

    // If full match fails, try matching just the remove lines (Claude often omits context)
    if (matchIndex === -1) {
      const removeOnly = hunk.lines
        .filter((l) => l.type === "remove")
        .map((l) => l.content);
      if (removeOnly.length > 0 && removeOnly.length < oldLines.length) {
        matchIndex = findHunkPosition(fileLines, removeOnly, hunk.oldStart);
        if (matchIndex !== -1) {
          // Found remove lines — just replace those, insert add lines in place
          const addOnly = hunk.lines
            .filter((l) => l.type === "add")
            .map((l) => l.content);
          fileLines.splice(matchIndex, removeOnly.length, ...addOnly);
          continue;
        }
      }
    }

    // Last resort: if there's exactly one remove line, do a fuzzy single-line search
    if (matchIndex === -1) {
      const removeOnly = hunk.lines
        .filter((l) => l.type === "remove")
        .map((l) => l.content);
      if (removeOnly.length === 1) {
        const needle = removeOnly[0].trim();
        if (needle.length > 0) {
          // Search near the hinted line first, then full file
          const hintIdx = hunk.oldStart - 1;
          for (const idx of nearbyIndices(hintIdx, fileLines.length)) {
            if (fileLines[idx].trim() === needle) {
              matchIndex = idx;
              break;
            }
          }
          if (matchIndex !== -1) {
            const addOnly = hunk.lines
              .filter((l) => l.type === "add")
              .map((l) => l.content);
            fileLines.splice(matchIndex, 1, ...addOnly);
            continue;
          }
        }
      }
    }

    if (matchIndex === -1) {
      return {
        success: false,
        filePath,
        newContent: original,
        error: `Could not match hunk at line ${hunk.oldStart} in ${filePath}`,
      };
    }

    // Apply: replace old lines with new lines
    fileLines.splice(matchIndex, oldLines.length, ...newLines);
  }

  return {
    success: true,
    filePath,
    newContent: fileLines.join("\n"),
  };
}

/**
 * Find the position where old lines match in the file.
 * Tries exact position first, then nearby, then full file.
 */
function findHunkPosition(
  fileLines: string[],
  oldLines: string[],
  hintLine: number,
): number {
  if (oldLines.length === 0) return -1;

  const exactIdx = hintLine - 1;

  // 1. Try exact line number
  if (matchesAt(fileLines, oldLines, exactIdx)) {
    return exactIdx;
  }

  // 2. Search nearby (+/- 20 lines)
  for (let offset = 1; offset <= 20; offset++) {
    if (matchesAt(fileLines, oldLines, exactIdx - offset)) {
      return exactIdx - offset;
    }
    if (matchesAt(fileLines, oldLines, exactIdx + offset)) {
      return exactIdx + offset;
    }
  }

  // 3. Search entire file
  for (let i = 0; i < fileLines.length; i++) {
    if (matchesAt(fileLines, oldLines, i)) {
      return i;
    }
  }

  return -1;
}

/** Check if the old lines match at a given position, using trimmed comparison. */
function matchesAt(
  fileLines: string[],
  oldLines: string[],
  startIdx: number,
): boolean {
  if (startIdx < 0 || startIdx + oldLines.length > fileLines.length) {
    return false;
  }
  for (let i = 0; i < oldLines.length; i++) {
    if (fileLines[startIdx + i].trimEnd() !== oldLines[i].trimEnd()) {
      return false;
    }
  }
  return true;
}

/** Generate indices starting near hintIdx and expanding outward, then full range. */
function nearbyIndices(hintIdx: number, length: number): number[] {
  const indices: number[] = [];
  // Near hint first
  for (let offset = 0; offset <= 30; offset++) {
    const lo = hintIdx - offset;
    const hi = hintIdx + offset;
    if (lo >= 0 && lo < length) indices.push(lo);
    if (offset > 0 && hi >= 0 && hi < length) indices.push(hi);
  }
  // Then full file
  for (let i = 0; i < length; i++) {
    indices.push(i);
  }
  return indices;
}
