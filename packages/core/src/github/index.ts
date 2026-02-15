export {
  stripCodeFences,
  parseDiffs,
  applyDiffToContent,
} from "./diff-parser.js";

export type {
  ParsedHunk,
  HunkLine,
  ParsedDiff,
  ApplyResult,
} from "./diff-parser.js";

export {
  buildPRTitle,
  buildPRDescription,
} from "./pr-description.js";

export type { PRDescriptionOptions } from "./pr-description.js";
