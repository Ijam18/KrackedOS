package memory

import (
	"context"
	"fmt"
	"strings"
)

const maxMemoryWriteBytes = 64 * 1024

// WriteMemoryTool is a portable tool adapter for LLM tool-calling runtimes.
type WriteMemoryTool struct {
	mem *MemoryStore
}

func NewWriteMemoryTool(mem *MemoryStore) *WriteMemoryTool {
	return &WriteMemoryTool{mem: mem}
}

func (w *WriteMemoryTool) Name() string { return "write_memory" }

func (w *WriteMemoryTool) Description() string {
	return "Write or append to memory (today's note or long-term MEMORY.md)"
}

func (w *WriteMemoryTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"target": map[string]interface{}{
				"type":        "string",
				"description": "Memory target: 'today' for daily note or 'long' for long-term memory",
				"enum":        []string{"today", "long"},
			},
			"content": map[string]interface{}{
				"type":        "string",
				"description": "The content to write or append",
			},
			"append": map[string]interface{}{
				"type":        "boolean",
				"description": "If true, append to existing content; if false, overwrite",
				"default":     true,
			},
		},
		"required": []string{"target", "content"},
	}
}

// Execute expects args: {"target":"today"|"long", "content":"...", "append":true|false}
func (w *WriteMemoryTool) Execute(ctx context.Context, args map[string]interface{}) (string, error) {
	select {
	case <-ctx.Done():
		return "", ctx.Err()
	default:
	}
	if w.mem == nil {
		return "", fmt.Errorf("write_memory: memory store is nil")
	}

	targetI, ok := args["target"]
	if !ok {
		return "", fmt.Errorf("write_memory: 'target' argument required (today|long)")
	}
	target, ok := targetI.(string)
	if !ok {
		return "", fmt.Errorf("write_memory: 'target' must be a string")
	}

	contentI, ok := args["content"]
	if !ok {
		return "", fmt.Errorf("write_memory: 'content' argument required")
	}
	content, ok := contentI.(string)
	if !ok {
		return "", fmt.Errorf("write_memory: 'content' must be a string")
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return "", fmt.Errorf("write_memory: 'content' cannot be empty")
	}
	if len(content) > maxMemoryWriteBytes {
		return "", fmt.Errorf("write_memory: 'content' exceeds %d bytes", maxMemoryWriteBytes)
	}

	appendFlag := true
	if a, ok := args["append"]; ok {
		if b, ok := a.(bool); ok {
			appendFlag = b
		}
	}

	switch target {
	case "today":
		if err := w.mem.AppendToday(content); err != nil {
			return "", err
		}
		return "appended to today", nil
	case "long":
		if appendFlag {
			prev, err := w.mem.ReadLongTerm()
			if err != nil {
				return "", err
			}
			if strings.TrimSpace(prev) == "" {
				if err := w.mem.WriteLongTerm(content); err != nil {
					return "", err
				}
				return "appended to long-term memory", nil
			}
			if err := w.mem.WriteLongTerm(strings.TrimRight(prev, "\n") + "\n" + content); err != nil {
				return "", err
			}
			return "appended to long-term memory", nil
		}
		if err := w.mem.WriteLongTerm(content); err != nil {
			return "", err
		}
		return "wrote long-term memory", nil
	default:
		return "", fmt.Errorf("write_memory: unknown target '%s'", target)
	}
}
