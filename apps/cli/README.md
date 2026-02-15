# @shipwellapp/cli

**Full Codebase Autopilot** — deep cross-file analysis powered by Claude's 1M token context window.

[![npm](https://img.shields.io/npm/v/@shipwellapp/cli?color=6366f1)](https://www.npmjs.com/package/@shipwellapp/cli)

## Install

```bash
npm install -g @shipwellapp/cli
```

## Quick Start

```bash
# Sign in (opens browser)
shipwell login

# Run a security audit
shipwell audit https://github.com/acme/api

# Audit a local project
shipwell audit ./my-project
```

## Commands

### Analysis

| Command | Description |
|---------|-------------|
| `shipwell audit <source>` | Security audit — vulnerabilities, auth flaws, data exposure |
| `shipwell migrate <source>` | Migration plan — ordered changes for framework/library upgrades |
| `shipwell refactor <source>` | Refactor analysis — duplication, dead code, architecture smells |
| `shipwell docs <source>` | Documentation — architecture overview, API docs, module guides |
| `shipwell upgrade <source>` | Dep upgrade — outdated deps, breaking changes, safe upgrade paths |

`<source>` can be a **GitHub URL** or a **local path**.

### Auto-Fix PRs

After analysis, if fixable findings are detected, the CLI can create a GitHub PR with the suggested fixes — authored by the **ShipwellHQ** GitHub App.

```bash
# Analyze and create a PR with auto-fixes
shipwell audit https://github.com/acme/api --create-pr

# Skip all confirmation prompts
shipwell audit https://github.com/acme/api --create-pr --yes

# Works with local repos too (resolves the GitHub remote automatically)
shipwell audit ./my-project --create-pr
```

> **Prerequisite:** The [ShipwellHQ GitHub App](https://github.com/apps/shipwellhq) must be installed on the target repository.

### Account & Config

```bash
# Interactive guided mode
shipwell interactive

# Authentication
shipwell login              # Sign in with Google via browser
shipwell logout             # Sign out and clear credentials
shipwell whoami             # Show current user, API key, and model

# Configuration
shipwell config             # View current configuration
shipwell config set api-key <key>    # Set Anthropic API key
shipwell config set model <model>    # Set default Claude model
shipwell config delete api-key       # Remove API key
shipwell config delete model         # Reset model to default
shipwell delete-key         # Shortcut to remove API key

# Utility
shipwell models             # List available Claude models
shipwell update             # Update CLI to latest version
```

## Options

All analysis commands accept these flags:

```
-k, --api-key <key>      Anthropic API key (or set ANTHROPIC_API_KEY)
-m, --model <model>      Claude model (or set SHIPWELL_MODEL)
-t, --target <target>    Migration target (for migrate operation)
-c, --context <context>  Additional context for analysis
-r, --raw                Also print raw streaming output
-y, --yes                Skip cost confirmation prompt
-o, --output <path>      Export report to file (.md or .json)
--create-pr              Create a GitHub PR with auto-fixes after analysis
```

## Export Reports

```bash
# Export as Markdown
shipwell audit ./my-repo -o report.md

# Export as JSON
shipwell audit ./my-repo -o report.json

# Skip cost confirmation and export
shipwell audit ./my-repo -y -o report.md
```

## Output

The CLI displays:

1. **Ingestion progress** — scanning files, reading with progress indicator
2. **Bundle stats** — files included, token count
3. **Cost estimate** — estimated API cost with confirmation prompt
4. **Live findings** — findings stream in real-time as Claude analyzes
5. **Metrics** — before/after comparisons with color-coded values
6. **Summary box** — total findings, severity breakdown, cross-file count, timing
7. **PR creation** — if `--create-pr` is set, prompts to create a fix PR with applied/skipped/failed counts

Severity levels are color-coded: `CRITICAL` (red), `HIGH` (orange), `MEDIUM` (yellow), `LOW` (blue), `INFO` (dim).

Cross-file issues are marked with `⟷`.

## Supported Models

| Model | ID |
|-------|----|
| Claude Sonnet 4.5 (default) | `claude-sonnet-4-5-20250929` |
| Claude Opus 4.6 | `claude-opus-4-6` |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` |

```bash
shipwell config set model claude-opus-4-6
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (required if not using `--api-key`) |
| `SHIPWELL_MODEL` | Default model (default: `claude-sonnet-4-5-20250929`) |
| `SHIPWELL_API_URL` | API base URL for PR creation (default: `https://shipwell.app`) |

## Requirements

- Node.js >= 18
- Anthropic API key ([get one here](https://console.anthropic.com/settings/keys))

## License

[MIT](../../LICENSE)
