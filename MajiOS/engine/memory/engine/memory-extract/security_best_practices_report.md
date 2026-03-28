# Security Best Practices Report - memory-extract

## Executive Summary
A focused Go security audit was performed on `memory-extract` using the skill guidance in `security-best-practices` (Go backend baseline). I found three medium-risk issues and implemented fixes for all three. No critical or high-severity findings remain in the reviewed code paths.

Scope audited:
- `memory-extract/memory/*.go`
- `memory-extract/scripts/install-memory.ps1`
- `memory-extract/README.md`

## Critical Findings
None.

## High Findings
None.

## Medium Findings

### MBP-001 - Path normalization/validation missing for project root (Fixed)
- Severity: Medium
- Location: `memory-extract/memory/bootstrap.go:11`, `memory-extract/memory/runtime.go:21`, `memory-extract/memory/store.go:33`
- Evidence: Added `normalizeProjectRoot(...)`, enforced non-empty/canonical absolute path, and used normalized path in runtime/store initialization.
- Impact: Without normalization and checks, callers could accidentally initialize memory in unintended locations (operational integrity risk).
- Fix: Implemented root normalization/validation and used `filepath.Join`/`filepath.Abs` consistently.
- Mitigation: Keep `projectRoot` internal/trusted in application code.

### MBP-002 - Unbounded tool-controlled memory write size (Fixed)
- Severity: Medium
- Location: `memory-extract/memory/write_memory_tool.go:9`, `memory-extract/memory/write_memory_tool.go:81`, `memory-extract/memory/runtime.go:9`, `memory-extract/memory/runtime.go:91`
- Evidence: Added `maxMemoryWriteBytes` (64 KiB) for tool writes and `maxTurnMessageBytes` (16 KiB) cap for captured turns.
- Impact: Unbounded writes could enable disk growth/DoS from repeated oversized payloads.
- Fix: Enforced strict per-write size limits and trimmed oversized captured messages.
- Mitigation: Optionally add total memory directory quotas at host/container level.

### MBP-003 - LLM ranking calls ignored caller cancellation/timeouts (Fixed)
- Severity: Medium
- Location: `memory-extract/memory/llm_ranker.go:39`, `memory-extract/memory/llm_ranker.go:43`, `memory-extract/memory/llm_ranker.go:73`
- Evidence: Added `RankWithContext(ctx, ...)` and changed provider calls to use the passed context.
- Impact: Long-running provider calls can hold resources if cancellation/deadline is not propagated.
- Fix: `Rank(...)` now delegates to `RankWithContext(context.Background(), ...)`; callers can use `RankWithContext` for strict timeout control.
- Mitigation: Prefer calling `RankWithContext` with a request-scoped context.

## Low Findings / Residual Risks

### MBP-004 - Memory is stored as plaintext markdown (Accepted design risk)
- Severity: Low
- Location: `memory-extract/memory/store.go`
- Evidence: `MEMORY.md` and daily `.md` files are plain text by design.
- Impact: Sensitive data written by the model can be exposed if host filesystem access is compromised.
- Recommendation: Avoid writing secrets to memory; optionally encrypt at rest in your host app.

### MBP-005 - Installer script overwrites existing memory package files by design
- Severity: Low
- Location: `memory-extract/scripts/install-memory.ps1:27`
- Evidence: `Copy-Item ... -Force` overwrites destination `.go` files.
- Impact: Local customizations in target project may be replaced.
- Recommendation: Use source control and review diffs before running installer in customized targets.

## Verification Notes
- Static audit completed with file/line evidence.
- Runtime verification (`go test ./...`) could not be executed in this environment because `go` is not installed in PATH.
