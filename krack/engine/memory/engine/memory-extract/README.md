# Memory Extract

Standalone extraction of PicoBot's memory subsystem, now packaged for drop-in project use.

## What You Get
- File-backed memory store (`memory/store.go`)
- Rankers (`memory/ranker.go`, `memory/llm_ranker.go`)
- Portable `write_memory` tool (`memory/write_memory_tool.go`)
- Project bootstrap + runtime hooks (`memory/bootstrap.go`, `memory/runtime.go`)
- Unit tests

## Install Go (Default First Step)
Use Go 1.22+ before integrating this package.

### Windows
```powershell
winget install GoLang.Go
```

### macOS
```bash
brew install go
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y golang-go
```

### Verify
```bash
go version
```

## Quick Drop-In (Any Go Project)
1. Copy `memory-extract/memory` folder into your project (or keep this module and import it).
2. Create runtime once at startup.
3. Add memory block into system prompt before each model call.
4. Capture each turn after response.
5. Register `WriteMemoryTool` in your tool-calling layer.

### Minimal Integration Example
```go
package main

import (
	"fmt"
	"log"

	"picobot-memory-extract/memory"
)

func main() {
	pm, err := memory.NewProjectMemoryRuntime(".", 200, 8, 7, nil)
	if err != nil {
		log.Fatal(err)
	}

	userMsg := "How should we reduce API latency?"
	memoryBlock, err := pm.BuildSystemPromptBlock(userMsg)
	if err != nil {
		log.Fatal(err)
	}

	systemPrompt := "You are my project AI assistant.\n\n" + memoryBlock
	fmt.Println(systemPrompt)

	assistantReply := "Add caching and profile the slowest endpoints first."
	if err := pm.CaptureTurn(userMsg, assistantReply); err != nil {
		log.Fatal(err)
	}

	_ = pm.RememberProjectFact("Latency target is p95 < 250ms")
}
```

## Tool-Calling Integration
Use `WriteMemoryTool` to let the model persist memories itself.

```go
mem := memory.NewMemoryStoreWithWorkspace(".", 200)
writeTool := memory.NewWriteMemoryTool(mem)

name := writeTool.Name()
desc := writeTool.Description()
params := writeTool.Parameters()

// Register name/desc/params in your LLM tools schema,
// then call writeTool.Execute(ctx, args) when invoked.
```

Expected args:
```json
{"target":"today|long","content":"...","append":true}
```


### One-Command Installer (Windows PowerShell)
```powershell
cd memory-extract
.\scripts\install-memory.ps1 -TargetProjectPath "E:\path\to\your-go-project"
```

This copies all `memory/*.go` files into your target project's `memory/` folder.
## Run
```bash
cd memory-extract
go test ./...
go run ./cmd/demo
```

## Storage Layout
- `./memory/MEMORY.md` (long-term)
- `./memory/YYYY-MM-DD.md` (daily notes, UTC)

## Notes
- Go is required to run tests and demos.
- If you want LLM-powered ranking, implement `LLMProvider` from `memory/llm_types.go` and pass it to `NewLLMRanker(...)`.

