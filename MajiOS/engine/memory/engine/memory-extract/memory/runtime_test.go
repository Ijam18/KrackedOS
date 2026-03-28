package memory

import (
	"context"
	"strings"
	"testing"
)

func TestWriteMemoryToolWritesAndAppendsLong(t *testing.T) {
	tmp := t.TempDir()
	s := NewMemoryStoreWithWorkspace(tmp, 10)
	tool := NewWriteMemoryTool(s)

	_, err := tool.Execute(context.Background(), map[string]interface{}{"target": "long", "content": "first", "append": false})
	if err != nil {
		t.Fatalf("execute write failed: %v", err)
	}
	_, err = tool.Execute(context.Background(), map[string]interface{}{"target": "long", "content": "second", "append": true})
	if err != nil {
		t.Fatalf("execute append failed: %v", err)
	}

	out, err := s.ReadLongTerm()
	if err != nil {
		t.Fatalf("read long failed: %v", err)
	}
	if !strings.Contains(out, "first") || !strings.Contains(out, "second") {
		t.Fatalf("long memory missing expected content: %q", out)
	}
}

func TestProjectMemoryRuntimeBasicFlow(t *testing.T) {
	tmp := t.TempDir()
	r, err := NewProjectMemoryRuntime(tmp, 50, 5, 2, nil)
	if err != nil {
		t.Fatalf("runtime init failed: %v", err)
	}
	if err := r.CaptureTurn("what is the project status", "tests are passing"); err != nil {
		t.Fatalf("capture turn failed: %v", err)
	}
	if err := r.RememberProjectFact("Primary language is Go"); err != nil {
		t.Fatalf("remember fact failed: %v", err)
	}
	ctx, err := r.BuildSystemPromptBlock("language")
	if err != nil {
		t.Fatalf("build prompt block failed: %v", err)
	}
	if !strings.Contains(ctx, "Primary language is Go") {
		t.Fatalf("expected long-term fact in context, got: %q", ctx)
	}
}
